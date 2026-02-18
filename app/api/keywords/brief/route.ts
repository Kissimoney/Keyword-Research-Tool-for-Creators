import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
    const { keyword } = await request.json();

    if (!keyword) {
        return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite",
        });

        const prompt = `
            Act as a high-end SEO specialist.
            Generate a comprehensive SEO content brief for the keyword: "${keyword}".
            
            Include:
            1. Suggested Title (Optimized for CTR)
            2. Recommended H1 and H2 structure (4-5 headings)
            3. Search Intent analysis
            4. 10 LSI/Semantic keywords
            5. Target Audience profile
            6. A 2-paragraph content summary.

            Format the response in clean Markdown.
        `;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            return NextResponse.json({ brief: text });
        } catch (apiErr: any) {
            console.warn('Brief API Limit Hit, using fallback');
            return NextResponse.json({
                brief: `## 📝 Content Brief: ${keyword} (Fallback Mode)\n\n### 🎯 Strategy\nThis keyword has high potential. You should create a 1,500+ word "Ultimate Guide" focusing on user search intent. \n\n### 🏗️ Structure\n- **H1:** The Ultimate Guide to ${keyword} (2026 Edition)\n- **H2:** Why ${keyword} Matters\n- **H2:** Best Practices for Success\n- **H2:** Avoid These Common Mistakess\n\n### 🔑 Key Keywords\n- ${keyword} tips, ${keyword} tutorial, ${keyword} best practices, how to use ${keyword}.`
            });
        }
    } catch (err: any) {
        console.error('Brief Error:', err);
        return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
    }
}
