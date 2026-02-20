import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function run() {
    const keyword = 'AI Side Hustles';
    const language = 'German';
    const prompt = `
Act as a senior Video SEO specialist (YouTube & TikTok).
Generate exactly 20 high-value video keywords, long-tail tags, and viral video ideas for: "${keyword}" in the ${language} language.
CRITICAL: The values for 'keyword', 'strategy', 'cluster', and 'intentLabel' MUST be fully translated and localized into ${language}.

Return ONLY a valid JSON array (no markdown, no prose) of 20 objects with these exact keys:
keyword (translated), searchVolume (integer), competitionScore (0-100 integer), cpcValue (float), intentType (MUST remain in English, one of: Informational, Entertainment, Tutorial, Viral), intentLabel (the translated intent intentType in ${language}), trendDirection (one of: up, down, neutral), strategy (a specific video hook or idea in ${language}), cluster (a short thematic group name in ${language}).
`;

    try {
        const result = await model.generateContent(prompt);
        console.log("Raw Response:", result.response.text());

        let text = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        text = text.slice(start, end + 1);
        text = text.replace(/,\s*([}\]])/g, '$1');

        const parsed = JSON.parse(text);
        console.log("Parsed keys of first object:", Object.keys(parsed[0]));
    } catch (e) {
        console.error(e);
    }
}

run();
