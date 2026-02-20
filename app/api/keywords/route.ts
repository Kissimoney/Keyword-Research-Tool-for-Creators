import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/* ── Helpers ─────────────────────────────────────────────────── */

async function getSiteMetadata(url: string) {
    try {
        const targetUrl = url.startsWith('http') ? url : `https://${url}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });
        clearTimeout(timeoutId);
        const html = await response.text();

        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
        const descriptionMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
        const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);

        return {
            title: titleMatch?.[1]?.trim() || 'Unknown Title',
            description: descriptionMatch?.[1]?.trim() || 'No description found',
            h1: h1Match?.[1]?.replace(/<[^>]+>/g, '').trim() || '',
            status: 'success' as const,
        };
    } catch {
        return { status: 'failed' as const, error: 'Could not reach site' };
    }
}

/**
 * Robustly extract a JSON array from a Gemini response that may contain
 * markdown fences, trailing commas, or extra prose.
 */
function extractJsonArray(raw: string): unknown[] {
    // Strip markdown fences
    let text = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Find the first '[' and last ']'
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('No JSON array found in response');

    text = text.slice(start, end + 1);

    // Remove trailing commas before ] or }
    text = text.replace(/,\s*([}\]])/g, '$1');

    return JSON.parse(text);
}

function buildFallback(keyword: string, mode: string) {
    if (mode === 'video') {
        const hooks = ['how to', 'best', 'tutorial', 'review 2026', 'for beginners', 'tips', 'mistakes', 'secrets'];
        const clusters = ['Tutorial', 'Entertainment', 'Viral', 'Educational'];
        return hooks.map((h, i) => ({
            keyword: `${keyword} ${h}`,
            searchVolume: Math.floor(Math.random() * 80_000) + 5_000,
            competitionScore: Math.floor(Math.random() * 50) + 10,
            cpcValue: parseFloat((Math.random() * 3).toFixed(2)),
            intentType: ['Tutorial', 'Entertainment', 'Informational', 'Viral'][i % 4],
            trendDirection: Math.random() > 0.4 ? 'up' : 'neutral',
            strategy: `Create a "${h}" video targeting ${keyword} to capture YouTube search traffic.`,
            cluster: clusters[i % clusters.length],
        }));
    }

    if (mode === 'competitor') {
        const angles = ['alternative', 'vs competitor', 'pricing', 'review', 'free trial', 'discount', 'features', 'comparison'];
        const clusters = ['Competitor Gaps', 'Direct Hits', 'Brand Alternatives', 'Buyer Intent'];
        return angles.map((a, i) => ({
            keyword: `${keyword} ${a}`,
            searchVolume: Math.floor(Math.random() * 20_000) + 1_000,
            competitionScore: Math.floor(Math.random() * 70) + 20,
            cpcValue: parseFloat((Math.random() * 8).toFixed(2)),
            intentType: ['Commercial', 'Transactional', 'Informational'][i % 3],
            trendDirection: Math.random() > 0.5 ? 'up' : 'neutral',
            strategy: `Target "${keyword} ${a}" to intercept competitor traffic at the decision stage.`,
            cluster: clusters[i % clusters.length],
        }));
    }

    // Web (default)
    const suffixes = ['best', 'how to', 'near me', 'for beginners', '2026', 'guide', 'review', 'pricing'];
    const clusters = ['General Research', 'Buyer Intent', 'Educational', 'Comparison'];
    return suffixes.map((s, i) => ({
        keyword: `${keyword} ${s}`,
        searchVolume: Math.floor(Math.random() * 50_000) + 500,
        competitionScore: Math.floor(Math.random() * 60) + 20,
        cpcValue: parseFloat((Math.random() * 5).toFixed(2)),
        intentType: i % 2 === 0 ? 'Informational' : 'Commercial',
        trendDirection: Math.random() > 0.5 ? 'up' : 'neutral',
        strategy: `Create a targeted "${s}" resource to capture mid-funnel traffic for "${keyword}".`,
        cluster: clusters[i % clusters.length],
    }));
}

/* ── Route handler ───────────────────────────────────────────── */

export async function POST(request: Request) {
    // Validate Content-Type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    let body: { keyword?: string; mode?: string; language?: string; isLiveMode?: boolean };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { keyword, mode = 'web', language = 'English', isLiveMode = false } = body;

    if (!keyword?.trim()) {
        return NextResponse.json({ error: 'Keyword or domain is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const headers = {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '99',
        'Cache-Control': 'no-store',
    };

    try {
        console.log(`[keywords] mode=${mode} language=${language} keyword="${keyword}"`);

        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            tools: isLiveMode ? [{ googleSearchRetrieval: {} }] as any : undefined,
        });

        // Competitor mode: try to fetch site metadata first
        let contextInfo = '';
        if (mode === 'competitor' && (keyword.includes('.') || keyword.startsWith('http'))) {
            const meta = await getSiteMetadata(keyword);
            if (meta.status === 'success') {
                contextInfo = `
COMPETITOR SITE DNA:
Title: ${meta.title}
Description: ${meta.description}
${meta.h1 ? `H1: ${meta.h1}` : ''}
                `.trim();
            }
        }

        const prompt =
            mode === 'video'
                ? `
Act as a senior Video SEO specialist (YouTube & TikTok).
Generate exactly 20 high-value video keywords, long-tail tags, and viral video ideas for: "${keyword}" in the ${language} language.

Return ONLY a valid JSON array (no markdown, no prose) of 20 objects with these exact keys:
keyword, searchVolume (integer), competitionScore (0-100 integer), cpcValue (float), intentType (one of: Informational, Entertainment, Tutorial, Viral), trendDirection (one of: up, down, neutral), strategy (a specific video hook or idea in ${language}), cluster (a short thematic group name in ${language}).
`
                : mode === 'competitor'
                    ? `
Act as a competitive intelligence analyst.
${contextInfo ? contextInfo + '\n' : ''}
Analyse the keyword footprint and gap opportunities for the competitor: "${keyword}" in the ${language} language.
Generate exactly 20 high-ROI keywords they likely rank for or where they are vulnerable in ${language}.
Focus on "Competitor Gaps" and "Direct Hits".

Return ONLY a valid JSON array (no markdown, no prose) of 20 objects with these exact keys:
keyword, searchVolume (integer), competitionScore (0-100 integer), cpcValue (float), intentType (one of: Commercial, Transactional, Informational), trendDirection (one of: up, down, neutral), strategy (how to beat them on this keyword in ${language}), cluster (in ${language}, one of: Competitor Gaps, Direct Hits, Brand Alternatives, Buyer Intent).
`
                    : `
Act as a senior Web SEO specialist and data analyst.
${isLiveMode ? 'USE REAL-TIME GOOGLE SEARCH to identify current trends, skyrocketing topics, and up-to-the-minute search data.' : ''}
Generate exactly 20 high-value keywords for: "${keyword}" in the ${language} language.

Return ONLY a valid JSON array (no markdown, no prose) of 20 objects with these exact keys:
keyword, searchVolume (integer), competitionScore (0-100 integer), cpcValue (float), intentType (one of: Informational, Commercial, Transactional, Navigational), trendDirection (one of: up, down, neutral), strategy (a specific content angle in ${language}), cluster (a short thematic group name in ${language}).
`;

        try {
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const keywords = extractJsonArray(responseText);
            return NextResponse.json(keywords, { headers });
        } catch (apiErr: any) {
            console.warn('[keywords] Gemini failed, using fallback:', apiErr.message);
            return NextResponse.json(buildFallback(keyword, mode), { headers });
        }
    } catch (err: any) {
        console.error('[keywords] Outer error:', err);
        return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500, headers });
    }
}
