const key = "AIzaSyB1dch-pl8hgoyMp4Z9VN1qMaTF1wYnsC4";

async function listModels() {
    console.log('Listing models for API key...');
    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await resp.json();
        if (resp.ok) {
            console.log('Available Models:');
            data.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
        } else {
            console.log('❌ FAIL to list models:', data.error?.message || 'Unknown error');
        }
    } catch (err) {
        console.log('💥 ERROR:', err.message);
    }
}

listModels();
