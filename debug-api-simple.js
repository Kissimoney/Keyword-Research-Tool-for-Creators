const key = "AIzaSyB1dch-pl8hgoyMp4Z9VN1qMaTF1wYnsC4";

async function debugGemini() {
    console.log('Testing hardcoded API key...');

    const versions = ['v1', 'v1beta'];
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.0-pro', 'gemini-2.0-flash-exp'];

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
