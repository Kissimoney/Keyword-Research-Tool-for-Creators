import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const HEADERS = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    let body: { keyword?: string; brief?: string; format?: 'blog' | 'video' | 'thread'; language?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { keyword, brief, format = 'blog', language = 'English' } = body;
    if (!keyword?.trim()) {
        return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const formatPrompts = {
        blog: `Generate a comprehensive, high-authority blog post (approx 600 words) in ${language}. Use a professional, data-driven tone with catchy subheadings, a strong introduction, and a concluding call-to-action.`,
        video: `Generate a high-engagement YouTube video script (3-5 minutes) in ${language}. Include a cinematic intro hook, 3 key educational segments, and a high-conversion outro.`,
        thread: `Generate a viral-ready 8-12 post X (Twitter) thread in ${language}. Start with a curiosity-gap hook, provide rapid-fire value, and end with a transition to a newsletter/link.`
    };

    const prompt = `
Act as an Elite Digital Strategist and Content Engineer.
Your goal is to transform a keyword brief into a publication-ready content draft in the ${language} language.

Keyword/Topic: "${keyword}"
Strategic Context:
${brief ? brief.slice(0, 1500) : "No context provided."}

REQUIRED FORMAT: ${format.toUpperCase()}
DRAFT SPECIFICATIONS: ${formatPrompts[format]}

Format the output in clean, structured Markdown. Use bolding and lists for readability. IMPORTANT: All content must be written in ${language}.
`.trim();

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return NextResponse.json({ draft: text }, { headers: HEADERS });
    } catch (apiErr: any) {
        console.error('[draft] Gemini failed:', apiErr.message);

        // Robust Fallback
        const lang = language.toLowerCase();
        let fallbackDraft = '';
        if (lang === 'german') {
            fallbackDraft = `# ${keyword} - Strategischer Inhaltsentwurf\n\n> **Hinweis:** Dies ist ein struktureller Fallback-Entwurf, der von unserer internen Engine generiert wurde.\n\n## Übersicht\nDieser Inhalt konzentriert sich auf "${keyword}" mit dem Hauptziel, ${format === 'blog' ? 'den Leser zu informieren' : format === 'video' ? 'den Betrachter zu fesseln' : 'virales Engagement zu fördern'}.\n\n## Kernpunkte\n- Grundkonzepte von ${keyword} erklärt.\n- Moderne Strategien für 2026.\n- Implementierungsleitfaden und Best Practices.\n\n## Empfohlene nächste Schritte\n1. Verfeinern Sie die Einleitung so, dass sie zu Ihrer Markenstimme passt.\n2. Fügen Sie einzigartige Daten oder persönliche Fallstudien hinzu.\n3. Optimieren Sie Bilder/Medien mit relevantem Alt-Text.`;
        } else if (lang === 'spanish') {
            fallbackDraft = `# ${keyword} - Borrador Estratégico de Contenido\n\n> **Nota:** Este es un borrador estructural generado por nuestro motor interno debido a la limitación de la IA.\n\n## Visión General\nEste contenido se centra en "${keyword}" con el objetivo principal de ${format === 'blog' ? 'educar al lector' : format === 'video' ? 'enganchar al espectador' : 'impulsar interacción viral'}.\n\n## Puntos Clave\n- Conceptos básicos de ${keyword} explicados.\n- Estrategias modernas para 2026.\n- Guía de implementación y mejores prácticas.\n\n## Próximos Pasos Sugeridos\n1. Refina la introducción para que encaje con la voz de tu marca.\n2. Agrega datos únicos o estudios de casos personales.\n3. Optimiza imágenes/multimedia con texto Alt relevante.`;
        } else if (lang === 'french') {
            fallbackDraft = `# ${keyword} - Brouillon de Contenu Stratégique\n\n> **Note:** Il s'agit d'un brouillon structurel généré par notre moteur interne.\n\n## Aperçu\nCe contenu se concentre sur "${keyword}" avec pour objectif principal de ${format === 'blog' ? 'éduquer le lecteur' : format === 'video' ? 'capter le spectateur' : 'stimuler l\'engagement viral'}.\n\n## Points Clés\n- Concepts de base de ${keyword} expliqués.\n- Stratégies modernes pour 2026.\n- Guide d'implémentation et bonnes pratiques.\n\n## Prochaines Étapes Suggérées\n1. Affiner l'introduction pour correspondre à la voix de votre marque.\n2. Ajouter des points de données uniques ou des cas d'étude.\n3. Optimiser les images/médias avec du texte alternatif pertinent.`;
        } else {
            fallbackDraft = `# ${keyword} - Strategic Content Draft\n\n> **Note:** This is a structural fallback draft generated by our internal engine due to high AI load.\n\n## Overview\nThis content focuses on "${keyword}" with a primary goal of ${format === 'blog' ? 'educating the reader' : format === 'video' ? 'hooking the viewer' : 'driving viral engagement'}.\n\n## Key Points\n- Core concepts of ${keyword} explained.\n- Modern strategies for 2026.\n- Implementation guide and best practices.\n\n## Suggested Next Steps\n1. Refine the introduction to match your brand voice.\n2. Add unique data points or personal case studies.\n3. Optimize images/media with relevant Alt-Text.`;
        }

        return NextResponse.json({
            draft: fallbackDraft,
            warning: 'Using intelligence fallback due to API constraints'
        }, { headers: HEADERS });
    }
}
