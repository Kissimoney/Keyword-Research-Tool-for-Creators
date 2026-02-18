const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function testGemini() {
    const key = process.env.GEMINI_API_KEY;
    console.log('API Key present:', !!key);
    if (!key) return;

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        const result = await model.generateContent("Say hello");
        console.log('Success:', result.response.text());
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testGemini();
