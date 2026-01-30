require("dotenv").config()
let genai=require('@google/genai')

let ai=new genai.GoogleGenAI({
    api_key:process.env.GOOGLE_API_KEY

})

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "what is the virat kholi",
  });
  console.log(response.text);
}

main();