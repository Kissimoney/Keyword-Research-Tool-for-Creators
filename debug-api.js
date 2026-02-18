const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function debugGemini() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.log('No API key found');
        return;
    }

    const versions = ['v1', 'v1beta'];
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.0-pro'];

    for (const v of versions) {
        for (const m of models) {
            console.log(`Testing ${m} on ${v}...`);
            try {
                const resp = await fetch(`https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent?key=${key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
                });

                const data = await resp.json();
                if (resp.ok) {
                    console.log(`✅ SUCCESS: ${m} works on ${v}`);
                    return;
                } else {
                    console.log(`❌ FAIL: ${m} on ${v} - ${data.error?.message || 'Unknown error'}`);
                }
            } catch (err) {
                console.log(`💥 ERROR: ${m} on ${v} - ${err.message}`);
            }
        }
    }
}

debugGemini();
