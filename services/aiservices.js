require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const genAI = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});

async function askAI(question) {
    const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: question
    });

    return response.text;
}

module.exports = { askAI };
