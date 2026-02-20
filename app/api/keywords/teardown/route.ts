import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: HEADERS });
}

export async function POST(request: Request) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Gemini API Key missing' }, { status: 500, headers: HEADERS });
    }

    try {
        const { url, keyword, language = 'English' } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'Competitor URL is required' }, { status: 400, headers: HEADERS });
        }

        // 1. Fetch the raw HTML
        console.log(`[teardown] Scraping URL: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }

        const html = await response.text();

        // 2. Lightweight Parsing (Extracting readable text chunks)
        // We'll strip scripts, styles, and grab the main content areas
        const metaTitle = html.match(/<title>(.*?)<\/title>/i)?.[1] || '';
        const metaDesc = html.match(/<meta name="description" content="(.*?)"/i)?.[1] || '';

        // Grab H1-H3s and P tags (approximate content)
        const bodyContent = html
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .substring(0, 8000); // 8k chars for Gemini Context

        // 3. Send to Gemini for Teardown
        const prompt = `
Act as a Senior SEO Strategist and Competitive Auditor. 
I am providing the scraped content of a competitor's page that ranks for the keyword: "${keyword}".

Target Language for Analysis: ${language}

COMPETITOR PAGE DATA:
Title: ${metaTitle}
Description: ${metaDesc}
Content Snippet: ${bodyContent}

Perform a 5-point SURGICAL TEARDOWN of this page.
Provide the output in beautiful Markdown (using ## for headers in ${language}):

1. **The Content Gap**: What specific sub-topics or questions did they MISS that we can cover?
2. **Technical Weaknesses**: Observations on their page structure or UX based on the content flow.
3. **Keyword Density Analysis**: How well (or poorly) are they optimized for "${keyword}"?
4. **The "Better Than Them" Plan**: exactly what 3 things should we do to outrank this page?
5. **Difficulty Rating**: Scale of 1-10 on how hard it will be to beat this specific page.

Format the response for a high-end dashboard. Be strategic, aggressive, and highly tactical.
`.trim();

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const teardown = result.response.text();

        return NextResponse.json({ teardown }, { headers: HEADERS });

    } catch (err: any) {
        console.error('[teardown] Error:', err.message);
        return NextResponse.json({
            error: 'Teardown failed',
            details: err.message,
            fallback: "Our scraper was blocked by this competitor's firewall. However, based on the general market for this keyword, we recommend focusing on 'specific user intent' and 'long-form case studies' to win."
        }, { status: 500, headers: HEADERS });
    }
}
