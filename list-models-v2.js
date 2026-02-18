const fs = require('fs');
const key = "AIzaSyB1dch-pl8hgoyMp4Z9VN1qMaTF1wYnsC4";

async function listModels() {
    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await resp.json();
        if (resp.ok) {
            const list = data.models.map(m => `- ${m.name}`).join('\n');
            fs.writeFileSync('models-output.txt', list);
            console.log('Saved model list to models-output.txt');
        } else {
            console.log('Error:', data.error.message);
        }
    } catch (err) {
        console.log('Error:', err.message);
    }
}

listModels();
