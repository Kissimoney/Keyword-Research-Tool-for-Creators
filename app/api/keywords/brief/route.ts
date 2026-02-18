import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const HEADERS = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    let body: { keyword?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { keyword } = body;
    if (!keyword?.trim()) {
        return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const prompt = `
Act as a senior SEO content strategist.
Generate a comprehensive SEO content brief for the keyword: "${keyword}".

Include these sections (use ## for each):
## 🎯 Search Intent
## 📝 Suggested Title & H1
## 🏗️ Content Structure (H2/H3 outline)
## 🔑 10 LSI / Semantic Keywords
## 👤 Target Audience Profile
## ✍️ Content Summary (2 paragraphs)

Format in clean Markdown with bold labels and bullet points.
`.trim();

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return NextResponse.json({ brief: text }, { headers: HEADERS });
    } catch (apiErr: any) {
        console.warn('[brief] Gemini failed, using fallback:', apiErr.message);
        return NextResponse.json({
            brief: `## 🎯 Search Intent\n**Intent:** Informational / Commercial\n\n## 📝 Suggested Title & H1\n- **Title:** The Ultimate Guide to ${keyword} (2026 Edition)\n- **H1:** Everything You Need to Know About ${keyword}\n\n## 🏗️ Content Structure\n- **H2:** What Is ${keyword}?\n- **H2:** Why ${keyword} Matters in 2026\n- **H2:** Step-by-Step Guide to ${keyword}\n- **H2:** Common Mistakes to Avoid\n- **H2:** Tools & Resources\n\n## 🔑 LSI Keywords\n${keyword} tips, ${keyword} tutorial, ${keyword} guide, best ${keyword} tools, ${keyword} for beginners, ${keyword} strategy, ${keyword} examples, ${keyword} checklist, ${keyword} 2026, how to ${keyword}\n\n## 👤 Target Audience\nContent creators, marketers, and entrepreneurs looking to leverage ${keyword} for growth.\n\n## ✍️ Content Summary\nThis piece should establish topical authority around "${keyword}" by covering the full spectrum from fundamentals to advanced tactics. Use data, examples, and actionable takeaways throughout.\n\nAim for 1,800+ words with a clear CTA driving readers toward a lead magnet or product demo.`,
        }, { headers: HEADERS });
    }
}
