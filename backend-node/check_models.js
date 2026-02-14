const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Just to initialize
        // The SDK doesn't have a direct 'listModels' method exposed on the instance easily in all versions, 
        // but we can try to hit the API or just rely on the error message which often suggests listing models.
        // Actually, checking the docs or source, it's usually `genAI.getGenerativeModel(...)`.
        // Correct way to list models with REST if SDK doesn't expose it easily:

        // START SCRIPT
        console.log("Checking available models...");
        // We will try a few common model names to see which one works.
        const modelsToTest = ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-pro"];

        for (const modelName of modelsToTest) {
            console.log(`Testing ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                console.log(`SUCCESS: ${modelName} works!`);
                return; // Found one that works
            } catch (error) {
                console.log(`FAILED: ${modelName} - ${error.message.split('[')[0]}`); // Print short error
            }
        }
    } catch (e) {
        console.error(e);
    }
}

listModels();
