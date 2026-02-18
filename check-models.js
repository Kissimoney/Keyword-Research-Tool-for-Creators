const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.log('No API key found in .env.local');
        return;
    }

    const genAI = new GoogleGenerativeAI(key);

    try {
        // We often can't list models easily without a management key, 
        // but we can try a simple generation with a very basic model name.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("test");
        console.log('Success with gemini-1.5-flash:', result.response.text());
    } catch (err) {
        console.log('Failed with gemini-1.5-flash:', err.message);

        try {
            const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result2 = await model2.generateContent("test");
            console.log('Success with gemini-pro:', result2.response.text());
        } catch (err2) {
            console.log('Failed with gemini-pro:', err2.message);
        }
    }
}

listModels();
