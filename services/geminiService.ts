
import { GoogleGenAI } from "@google/genai";

// Fixed: Initializing GoogleGenAI with API key from environment variable as per specified guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const summarizeConsultation = async (notes: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres un asistente médico experto. Resume las siguientes notas de una consulta podológica para el historial del paciente, resaltando diagnóstico y tratamiento sugerido: "${notes}"`,
    });
    return response.text;
  } catch (error) {
    console.error("Error summarizeConsultation:", error);
    return "Error generating summary.";
  }
};
