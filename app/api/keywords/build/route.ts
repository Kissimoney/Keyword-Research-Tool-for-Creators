import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
    const { keyword, brief } = await request.json();

    if (!keyword) {
        return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite",
        });

        const prompt = `
            Act as a Strategic Growth Lead and Content Architect.
            You are building a "Master execution Plan" for the keyword: "${keyword}".
            
            Based on this initial brief context:
            ${brief}

            Generate a deeply actionable, industrial-grade EXECUTION STRATEGY.
            
            Your response MUST include these specific sections:
            
            1. 🔥 THE COMPETITIVE EDGE (Specific tactical ways to outperform the current top 10 results)
            2. 🛠️ TECHNICAL REQUIREMENTS (Schema markup needs, page speed targets, UX requirements)
            3. 💸 CONVERSION ARCHITECTURE (Specific CTAs, high-intent lead magnets, and trust signals to include)
            4. 🚀 DISTRIBUTION ROADMAP (3-phase plan for where and how to promote this content: Social, Email, Communities)
            5. 🔗 INTERNAL LINKING CLUSTER (Suggest 5 related topics to link FROM and 5 to link TO)
            6. 📈 KPI DASHBOARD (What exact metrics to track to define success for this specific piece)

            Format the response in beautifully structured Markdown with bold headers and bullet points. 
            Use professional, aggressive, and highly strategic language.
        `;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            return NextResponse.json({ plan: text });
        } catch (apiErr: any) {
            console.warn('Build API Limit Hit or Error, using fallback:', apiErr.message);
            return NextResponse.json({
                plan: `
# 🚀 Strategic Roadmap: ${keyword} (Premium Execution Plan)

## 🔥 THE COMPETITIVE EDGE
*   **Deep Content Clusters:** Create a 10-page content silo around "${keyword}" to establish topical authority.
*   **Interactive Tools:** Deploy a mini-calculator or data visualization tool to increase time-on-page and backlinks.
*   **User Intent Match:** Shift focus from generic "what is" to tactical "how to implement," matching high-intent commercial surges.

## 🛠️ TECHNICAL REQUIREMENTS
*   **Schema Markup:** Implement Article and FAQ Schema to capture "People Also Ask" snippets.
*   **Performance:** Target <1.5s LCP (Largest Contentful Paint) for mobile dominance.
*   **UX:** Implement a floating table of contents and internal anchor links for better navigation.

## 💸 CONVERSION ARCHITECTURE
*   **Primary CTA:** Direct users to the main "Intelligence Dashboard" lead magnet.
*   **Micro-conversions:** Contextual sidebar opt-ins for specific "${keyword}" checklists.
*   **Trust Signals:** Integrate real-time social proof and market data visualizations.

## 🚀 DISTRIBUTION ROADMAP
*   **Phase 1:** Seed in relevant niche subreddits and Slack communities using "Helpful Expert" framing.
*   **Phase 2:** Automated outreach to industry newsletters for inclusion in "Best of" roundups.
*   **Phase 3:** Repurpose into 5 high-impact LinkedIn carousels and 2 deep-dive video scripts.

## 📈 KPI DASHBOARD
*   **Focus Metric:** Conversion Rate from visitor to lead (Target: 4.5%).
*   **Secondary:** Backlink acquisition velocity and keyword momentum in the Top 10.
`
            });
        }
    } catch (err: any) {
        console.error('Build Route Error:', err);
        return NextResponse.json({ error: 'System processing failed' }, { status: 500 });
    }
}
