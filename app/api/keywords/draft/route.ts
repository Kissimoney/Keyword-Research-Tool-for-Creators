import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const HEADERS = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    let body: { keyword?: string; brief?: string; format?: 'blog' | 'video' | 'thread' };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { keyword, brief, format = 'blog' } = body;
    if (!keyword?.trim()) {
        return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const formatPrompts = {
        blog: "Generate a comprehensive, high-authority blog post (approx 600 words). Use a professional, data-driven tone with catchy subheadings, a strong introduction, and a concluding call-to-action.",
        video: "Generate a high-engagement YouTube video script (3-5 minutes). Include a cinematic intro hook, 3 key educational segments, and a high-conversion outro.",
        thread: "Generate a viral-ready 8-12 post X (Twitter) thread. Start with a curiosity-gap hook, provide rapid-fire value, and end with a transition to a newsletter/link."
    };

    const prompt = `
Act as an Elite Digital Strategist and Content Engineer.
Your goal is to transform a keyword brief into a publication-ready content draft.

Keyword/Topic: "${keyword}"
Strategic Context:
${brief ? brief.slice(0, 1500) : "No context provided."}

REQUIRED FORMAT: ${format.toUpperCase()}
DRAFT SPECIFICATIONS: ${formatPrompts[format]}

Format the output in clean, structured Markdown. Use bolding and lists for readability.
`.trim();

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return NextResponse.json({ draft: text }, { headers: HEADERS });
    } catch (apiErr: any) {
        console.error('[draft] Gemini failed:', apiErr.message);
        return NextResponse.json({ error: 'Draft generation failed. Please try again later.' }, { status: 500 });
    }
}
