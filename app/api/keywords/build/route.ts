import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const HEADERS = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    let body: { keyword?: string; brief?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { keyword, brief } = body;
    if (!keyword?.trim()) {
        return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const prompt = `
Act as a Strategic Growth Lead and Content Architect.
Build a "Master Execution Plan" for the keyword: "${keyword}".

${brief ? `Context from initial brief:\n${brief.slice(0, 1200)}\n` : ''}

Generate a deeply actionable, industrial-grade EXECUTION STRATEGY with these exact sections (use ## for each):

## 🔥 The Competitive Edge
(Specific tactical ways to outperform the current top 10 results)

## 🛠️ Technical Requirements
(Schema markup, Core Web Vitals targets, UX requirements)

## 💸 Conversion Architecture
(Specific CTAs, high-intent lead magnets, trust signals)

## 🚀 Distribution Roadmap
(3-phase plan: Social, Email, Communities)

## 🔗 Internal Linking Cluster
(5 topics to link FROM, 5 to link TO)

## 📈 KPI Dashboard
(Exact metrics to track success for this specific piece)

Use professional, aggressive, strategic language. Format in clean Markdown with bold labels and bullet points.
`.trim();

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return NextResponse.json({ plan: text }, { headers: HEADERS });
    } catch (apiErr: any) {
        console.warn('[build] Gemini failed, using fallback:', apiErr.message);
        return NextResponse.json({
            plan: `## 🔥 The Competitive Edge\n- **Deep Content Clusters:** Build a 10-page silo around "${keyword}" to establish topical authority.\n- **Interactive Tools:** Deploy a mini-calculator or data visualisation to increase time-on-page and earn backlinks.\n- **Intent Match:** Shift from generic "what is" to tactical "how to implement" — targeting high-intent commercial surges.\n\n## 🛠️ Technical Requirements\n- **Schema:** Implement Article + FAQ Schema to capture "People Also Ask" snippets.\n- **Performance:** Target <1.5s LCP on mobile for ranking dominance.\n- **UX:** Floating table of contents + internal anchor links for navigation.\n\n## 💸 Conversion Architecture\n- **Primary CTA:** Drive users to the main Intelligence Dashboard lead magnet.\n- **Micro-conversions:** Contextual sidebar opt-ins for "${keyword}" checklists.\n- **Trust Signals:** Real-time social proof and market data visualisations.\n\n## 🚀 Distribution Roadmap\n- **Phase 1:** Seed in niche subreddits and Slack communities using "Helpful Expert" framing.\n- **Phase 2:** Automated outreach to industry newsletters for "Best of" roundup inclusion.\n- **Phase 3:** Repurpose into 5 LinkedIn carousels and 2 deep-dive video scripts.\n\n## 🔗 Internal Linking Cluster\n**Link FROM:** Related guides, comparison posts, tool reviews, beginner tutorials, case studies.\n**Link TO:** Pricing page, feature deep-dives, success stories, free tool, newsletter signup.\n\n## 📈 KPI Dashboard\n- **Primary:** Conversion rate from visitor → lead (Target: 4.5%)\n- **Secondary:** Backlink acquisition velocity and keyword momentum in Top 10\n- **Engagement:** Avg. time on page >3:30, scroll depth >70%`,
        }, { headers: HEADERS });
    }
}
