import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const HEADERS = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    let body: { keyword?: string; language?: string; isLiveMode?: boolean };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { keyword, language = 'English', isLiveMode = false } = body;
    if (!keyword?.trim()) {
        return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const prompt = `
Act as a senior SEO content strategist.
${isLiveMode ? 'USE REAL-TIME GOOGLE SEARCH to gather the latest information, current statistics, and top-ranking competitor structures for this topic.' : ''}
Generate a comprehensive SEO content brief for the keyword: "${keyword}" in the ${language} language.

Include these sections (use ## for each, but translate headers to ${language}):
## 🎯 Search Intent
## 📝 Suggested Title & H1
## 🏗️ Content Structure (H2/H3 outline)
## 🔑 10 LSI / Semantic Keywords
## 👤 Target Audience Profile
## ✍️ Content Summary (2 paragraphs)

Format in clean Markdown with bold labels and bullet points. IMPORTANT: All content must be written in ${language}.
`.trim();

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            tools: isLiveMode ? [{ googleSearchRetrieval: {} }] as any : undefined,
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return NextResponse.json({ brief: text }, { headers: HEADERS });
    } catch (apiErr: any) {
        console.warn('[brief] Gemini failed, using fallback:', apiErr.message);

        const lang = language.toLowerCase();
        let fallbackText = '';
        if (lang === 'german') {
            fallbackText = `## 🎯 Suchintention\n**Intention:** Informativ / Kommerziell\n\n## 📝 Titel & H1\n- **Titel:** Der ultimative Leitfaden zu ${keyword} (2026)\n- **H1:** Alles was Sie über ${keyword} wissen müssen\n\n## 🏗️ Struktur\n- **H2:** Was ist ${keyword}?\n- **H2:** Warum ${keyword} 2026 wichtig ist\n- **H2:** Schritt-für-Schritt Anleitung\n- **H2:** Häufige Fehler\n- **H2:** Tools & Ressourcen\n\n## 🔑 Semantic Keywords\n${keyword} tipps, ${keyword} tutorial, bester ${keyword} guide, ${keyword} für anfänger, ${keyword} strategie, ${keyword} beispiele, ${keyword} 2026\n\n## 👤 Zielgruppe\nContent-Ersteller, Vermarkter und Unternehmer, die ${keyword} für ihr Wachstum nutzen wollen.\n\n## ✍️ Zusammenfassung\nDieser Artikel zielt darauf ab, in-depth Wissen über "${keyword}" aufzubauen, von den Grundlagen bis zu fortgeschrittenen Taktiken. Verwenden Sie reale Daten und Beispiele.`;
        } else if (lang === 'spanish') {
            fallbackText = `## 🎯 Intención de Búsqueda\n**Intención:** Informativa / Comercial\n\n## 📝 Título sugerido y H1\n- **Título:** La guía definitiva sobre ${keyword} (2026)\n- **H1:** Todo lo que necesitas saber sobre ${keyword}\n\n## 🏗️ Estructura del Contenido\n- **H2:** ¿Qué es ${keyword}?\n- **H2:** ¿Por qué ${keyword} es importante en 2026?\n- **H2:** Guía paso a paso sobre ${keyword}\n- **H2:** Errores comunes a evitar\n- **H2:** Herramientas y Recursos\n\n## 🔑 Palabras Clave LSI\n${keyword} consejos, ${keyword} tutorial, guía ${keyword}, mejores herramientas ${keyword}, ${keyword} para principiantes, estrategia ${keyword}, ejemplos de ${keyword}\n\n## 👤 Público Objetivo\nCreadores de contenido, profesionales de marketing y emprendedores que buscan aprovechar ${keyword} para crecer.\n\n## ✍️ Resumen del Contenido\nEste artículo debe establecer autoridad tópica sobre "${keyword}" cubriendo desde conceptos fundamentales hasta tácticas avanzadas. Usa datos, ejemplos y acciones clave.`;
        } else if (lang === 'french') {
            fallbackText = `## 🎯 Intention de Recherche\n**Intention:** Informative / Commerciale\n\n## 📝 Titre Suggéré & H1\n- **Titre:** Le guide ultime de ${keyword} (2026)\n- **H1:** Tout ce que vous devez savoir sur ${keyword}\n\n## 🏗️ Structure du Contenu\n- **H2:** Qu'est-ce que ${keyword}?\n- **H2:** Pourquoi ${keyword} est important en 2026\n- **H2:** Guide étape par étape de ${keyword}\n- **H2:** Erreurs courantes à éviter\n- **H2:** Outils et Ressources\n\n## 🔑 Mots-clés Sémantiques\n${keyword} astuces, ${keyword} tutoriel, guide ${keyword}, meilleurs outils ${keyword}, ${keyword} pour débutants, stratégie ${keyword}, ${keyword} 2026, comment faire ${keyword}\n\n## 👤 Public Cible\nCréateurs de contenu, spécialistes du marketing et entrepreneurs cherchant à utiliser ${keyword}.\n\n## ✍️ Résumé du Contenu\nCette pièce devrait établir une autorité autour de "${keyword}" en couvrant tout le spectre, des principes fondamentaux aux tactiques avancées. Utilisez des données et des exemples concrets.`;
        } else {
            fallbackText = `## 🎯 Search Intent\n**Intent:** Informational / Commercial\n\n## 📝 Suggested Title & H1\n- **Title:** The Ultimate Guide to ${keyword} (2026 Edition)\n- **H1:** Everything You Need to Know About ${keyword}\n\n## 🏗️ Content Structure\n- **H2:** What Is ${keyword}?\n- **H2:** Why ${keyword} Matters in 2026\n- **H2:** Step-by-Step Guide to ${keyword}\n- **H2:** Common Mistakes to Avoid\n- **H2:** Tools & Resources\n\n## 🔑 LSI Keywords\n${keyword} tips, ${keyword} tutorial, ${keyword} guide, best ${keyword} tools, ${keyword} for beginners, ${keyword} strategy, ${keyword} examples, ${keyword} checklist, ${keyword} 2026, how to ${keyword}\n\n## 👤 Target Audience\nContent creators, marketers, and entrepreneurs looking to leverage ${keyword} for growth.\n\n## ✍️ Content Summary\nThis piece should establish topical authority around "${keyword}" by covering the full spectrum from fundamentals to advanced tactics. Use data, examples, and actionable takeaways throughout.\n\nAim for 1,800+ words with a clear CTA driving readers toward a lead magnet or product demo.`;
        }

        return NextResponse.json({
            brief: fallbackText,
        }, { headers: HEADERS });
    }
}
