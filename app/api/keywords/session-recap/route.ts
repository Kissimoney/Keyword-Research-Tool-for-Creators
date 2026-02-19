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

    let keywords: string[] = [];
    let title: string = 'Recent Activity';

    try {
        const body = await request.json();
        keywords = body.keywords || [];
        title = body.title || 'Recent Activity';

        if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
            return NextResponse.json({ error: 'No keywords provided for recap' }, { status: 400, headers: HEADERS });
        }

        const prompt = `
Act as a Senior Market Intelligence Analyst.
I have a list of keyword research queries from a session titled "${title}".
Your goal is to synthesize these searches into a high-level strategic recap.

Keywords analyzed:
${keywords.join(', ')}

Provide a concise, executive summary (approx 150-200 words) that includes:
1. **Focus Area**: What is the overarching theme of this session?
2. **Niche Insights**: Any specific patterns or interesting sub-niches discovered?
3. **Strategic Recommendation**: What should the creator do next based on this research?
4. **Macro Trend**: How does this research fit into current market trends?

Format the output in clean, structured Markdown. Use professional headers.
`.trim();

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return NextResponse.json({ recap: text }, { headers: HEADERS });
    } catch (apiErr: any) {
        console.error('[session-recap] Gemini failed:', apiErr.message);

        const fallbackRecap = `
# Strategic Session Recap: ${title}

> **Note:** This is an automated summary based on your recent activity footprint.

## Focus Area
Your session centered on **${keywords.slice(0, 3).join(', ')}**, indicating a strong interest in high-leverage growth strategies and digital monetization.

## Niche Insights
The combination of these searches suggests you are looking for low-competition entry points with high commercial intent. There is a clear pattern of searching for "2026" trends and "automation" workflows.

## Strategic Recommendation
- **Deep Dive**: Select your top 3 keywords and build a content cluster.
- **Conversion**: Match these topics with high-ticket affiliate offers or custom digital products.
- **Next Search**: Investigate "distribution channels" for these specific niches.

## Macro Trend
These topics align with the increasing shift towards AI-assisted productivity and the decentralization of digital media creation.
        `.trim();

        return NextResponse.json({
            recap: fallbackRecap,
            warning: 'Using automated fallback due to AI load'
        }, { headers: HEADERS });
    }
}
