import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const HEADERS = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    let body: { keyword?: string; brief?: string; language?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { keyword, brief, language = 'English' } = body;
    if (!keyword?.trim()) {
        return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const prompt = `
Act as a Strategic Growth Lead and Content Architect.
Build a "Master Execution Plan" for the keyword: "${keyword}" in the ${language} language.

${brief ? `Context from initial brief:\n${brief.slice(0, 1200)}\n` : ''}

Generate a deeply actionable, industrial-grade EXECUTION STRATEGY with these exact sections (use ## for each, but translate headers to ${language}):

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

Use professional, aggressive, strategic language in ${language}. Format in clean Markdown with bold labels and bullet points. IMPORTANT: All content must be written in ${language}.
`.trim();

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return NextResponse.json({ plan: text }, { headers: HEADERS });
    } catch (apiErr: any) {
        console.warn('[build] Gemini failed, using fallback:', apiErr.message);
        const lang = language.toLowerCase();
        let fallbackText = '';
        if (lang === 'german') {
            fallbackText = `## 🔥 Der Wettbewerbsvorteil\n- **Tiefgreifende Themencluster:** Bauen Sie eine 10-seitige Struktur um "${keyword}" auf.\n- **Interaktive Tools:** Integrieren Sie einen Mini-Rechner oder eine Datenvisualisierung, um Backlinks zu generieren.\n- **Intention Matching:** Wechseln Sie von "Was ist" zu "Wie man umsetzt".\n\n## 🛠️ Technische Anforderungen\n- **Schema:** Implementieren Sie Article + FAQ Schema.\n- **Performance:** Ziel: <1.5s LCP auf Mobilgeräten.\n- **UX:** Schwebendes Inhaltsverzeichnis + interne Links.\n\n## 💸 Conversion-Architektur\n- **Primärer Call-to-Action:** Lead-Magnet für Intelligence Dashboards.\n- **Mikro-Conversions:** Sidebar Opt-ins für "${keyword}" Checklisten.\n- **Vertrauenssignale:** Echtzeit-Social-Proof und Marktdaten.\n\n## 🚀 Vertriebs-Roadmap\n- **Phase 1:** Seed in relevanten Subreddits und Slack-Communities.\n- **Phase 2:** Automatisierter Outreach für Branchen-Newsletter.\n- **Phase 3:** Umnutzung in 5 LinkedIn-Karussells und 2 tiefe Videoskripte.\n\n## 🔗 Internes Linkbuilding-Cluster\n**Link VON:** Verwandten Ratgebern, Tools, Anfänger-Tutorials.\n**Link ZU:** Pricing-Seite, Funktionsübersichten, Newsletter.\n\n## 📈 KPI Dashboard\n- **Primär:** Conversion-Rate Besucher → Lead (Ziel: 4.5%)\n- **Sekundär:** Backlink-Wachstum und Keyword-Ranking in den Top 10\n- **Interaktion:** Durchschn. Sitzungsdauer >3:30, Scrolltiefe >70%`;
        } else if (lang === 'spanish') {
            fallbackText = `## 🔥 La Ventaja Competitiva\n- **Clústeres de Contenido:** Crea un silo de 10 páginas sobre "${keyword}".\n- **Herramientas Interactivas:** Implementa una mini-calculadora o visualización de datos.\n- **Intención de Búsqueda:** Cambia de "qué es" a tácticas de "cómo hacerlo".\n\n## 🛠️ Requisitos Técnicos\n- **Schema:** Implementa Schema de Artículo y FAQ.\n- **Rendimiento:** Objetivo <1.5s LCP en móvil.\n- **UX:** Tabla de contenido flotante.\n\n## 💸 Arquitectura de Conversión\n- **Call-to-Action Principal:** Drive a los usuarios al dashboard principal.\n- **Micro-conversiones:** Opt-ins laterales para checklist de "${keyword}".\n- **Señales de Confianza:** Prueba social en tiempo real.\n\n## 🚀 Roadmap de Distribución\n- **Fase 1:** Sembrar en comunidades relevantes de Slack y Subreddits.\n- **Fase 2:** Alcance automatizado de newsletters de la industria.\n- **Fase 3:** Reciclar en 5 carruseles de LinkedIn y 2 guiones de video.\n\n## 🔗 Clúster de Enlazado Interno\n**Enlazar DESDE:** Guías, comparaciones, tutoriales para principiantes.\n**Enlazar HACIA:** Página de precios, casos de éxito, suscripción al newsletter.\n\n## 📈 Panel de KPIs\n- **Principal:** Tasa de conversión de visitante a lead (Objetivo: 4.5%)\n- **Secundario:** Adquisición de enlaces y momentum en el Top 10\n- **Interacción:** Tiempo promedio en página >3:30, scroll >70%`;
        } else if (lang === 'french') {
            fallbackText = `## 🔥 L'Avantage Concurrentiel\n- **Groupes de Contenu:** Construisez un silo de 10 pages autour de "${keyword}".\n- **Outils Interactifs:** Déployez un mini-calculateur ou une dataviz.\n- **Correspondance d'Intention:** Passez de "qu'est-ce que" à "comment implémenter".\n\n## 🛠️ Exigences Techniques\n- **Schéma:** Implémentez le Schéma Article + FAQ.\n- **Performance:** Ciblez moins de 1.5s LCP sur mobile.\n- **UX:** Sommaire flottant + liens internes pour la navigation.\n\n## 💸 Architecture de Conversion\n- **Call-to-Action Principal:** Conduire les utilisateurs vers le tableau de bord.\n- **Micro-conversions:** Opt-ins contextuels pour les checklists "${keyword}".\n- **Signaux de Confiance:** Preuve sociale en temps réel.\n\n## 🚀 Plan de Distribution\n- **Phase 1:** Diffusion dans des sous-reddits spécialisés et Slack.\n- **Phase 2:** Prospection automatisée pour les newsletters de l'industrie.\n- **Phase 3:** Réutilisation dans 5 carrousels LinkedIn et 2 scripts vidéo.\n\n## 🔗 Groupe de Maillage Interne\n**Lien DEPUIS:** Guides associés, posts de comparaison, tutoriels.\n**Lien VERS:** Page des prix, détails des fonctionnalités, inscription.\n\n## 📈 Tableau de Bord KPI\n- **Principal:** Taux de conversion visiteur → prospect (Cible : 4.5%)\n- **Secondaire:** Acquisition de backlinks et dynamique du Top 10\n- **Engagement:** Temps moyen >3:30, profondeur de défilement >70%`;
        } else {
            fallbackText = `## 🔥 The Competitive Edge\n- **Deep Content Clusters:** Build a 10-page silo around "${keyword}" to establish topical authority.\n- **Interactive Tools:** Deploy a mini-calculator or data visualisation to increase time-on-page and earn backlinks.\n- **Intent Match:** Shift from generic "what is" to tactical "how to implement" — targeting high-intent commercial surges.\n\n## 🛠️ Technical Requirements\n- **Schema:** Implement Article + FAQ Schema to capture "People Also Ask" snippets.\n- **Performance:** Target <1.5s LCP on mobile for ranking dominance.\n- **UX:** Floating table of contents + internal anchor links for navigation.\n\n## 💸 Conversion Architecture\n- **Primary CTA:** Drive users to the main Intelligence Dashboard lead magnet.\n- **Micro-conversions:** Contextual sidebar opt-ins for "${keyword}" checklists.\n- **Trust Signals:** Real-time social proof and market data visualisations.\n\n## 🚀 Distribution Roadmap\n- **Phase 1:** Seed in niche subreddits and Slack communities using "Helpful Expert" framing.\n- **Phase 2:** Automated outreach to industry newsletters for "Best of" roundup inclusion.\n- **Phase 3:** Repurpose into 5 LinkedIn carousels and 2 deep-dive video scripts.\n\n## 🔗 Internal Linking Cluster\n**Link FROM:** Related guides, comparison posts, tool reviews, beginner tutorials, case studies.\n**Link TO:** Pricing page, feature deep-dives, success stories, free tool, newsletter signup.\n\n## 📈 KPI Dashboard\n- **Primary:** Conversion rate from visitor → lead (Target: 4.5%)\n- **Secondary:** Backlink acquisition velocity and keyword momentum in Top 10\n- **Engagement:** Avg. time on page >3:30, scroll depth >70%`;
        }

        return NextResponse.json({
            plan: fallbackText,
        }, { headers: HEADERS });
    }
}
