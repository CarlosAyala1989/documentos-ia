import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Puedes elegir cualquiera de las API keys disponibles
const apiKey = process.env.API_KEY_4; // Usando la cuarta API key

const ai = new GoogleGenAI({ apiKey });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Dime un chiste corto sobre programadores",
    responseFormat: "text",
    temperature: 0.5,
    maxOutputTokens: 50,
    topP: 0.9,
    topK: 40,
    stopSequences: ["\n", "Fin del chiste"]
  });
  console.log(response.text);
}

main();