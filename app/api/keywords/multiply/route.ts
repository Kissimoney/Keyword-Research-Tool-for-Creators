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
        const { content, platform, keyword, language = 'English' } = await request.json();

        if (!content || !platform) {
            return NextResponse.json({ error: 'Content and Platform are required' }, { status: 400, headers: HEADERS });
        }

        const prompts: Record<string, string> = {
            linkedin: `Transform this content into a high-authority LinkedIn post. Use a hook at the start, use bullet points, and include 3 relevant hashtags. Tone: Professional but human. Language: ${language}.`,
            twitter: `Transform this content into a viral Twitter (X) thread of 3-5 tweets. Each tweet should be concise and engaging. Include a hook in the first tweet. Language: ${language}.`,
            newsletter: `Transform this content into a value-packed Email Newsletter section. Include a catchy subject line. Tone: Friendly, educational, and direct. Language: ${language}.`,
            script: `Transform this content into a 60-second viral Short-form Video Script (TikTok/Reels/Shorts). Include visual cues [Scene] and spoken text. Tone: High energy, fast-paced. Language: ${language}.`,
            thread: `Transform this content into a detailed "How-to" thread for a community forum. Language: ${language}.`
        };

        const prompt = `
Act as an Omnichannel Content Strategist.
I have a core piece of content about "${keyword}".
Your task is to REPURPOSE this content for the ${platform} platform.

CORE CONTENT:
${content.substring(0, 10000)}

INSTRUCTIONS:
${prompts[platform.toLowerCase()] || prompts.linkedin}

Format the response in clean Markdown. IMPORTANT: The output must be written entirely in ${language}.
`.trim();

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const transformedContent = result.response.text();

        return NextResponse.json({ transformedContent }, { headers: HEADERS });

    } catch (err: any) {
        console.error('[multiply] Error:', err.message);
        return NextResponse.json({ error: 'Multiplication failed', details: err.message }, { status: 500, headers: HEADERS });
    }
}
