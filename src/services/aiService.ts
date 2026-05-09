import { GoogleGenAI } from "@google/genai";
import { RFQ } from "../lib/constants";

const AI_SYSTEM = `Eres ARIA (Asistente de Riesgo Industrial Avanzado), experto en seguridad de máquinas e higiene industrial.
DOMINIO: ISO 12100:2010, ISO 13849-1/2, ISO 13855, ISO 13857, ISO 14119, ISO 10218-1/2, ISO/TS 15066, IEC 62061, IEC 61508, IEC 60204-1, EN 201, Ley 19587, Ley 24557, Decreto 351/79, NR-12.

CONOCIMIENTO BASE (CUESTIONARIO RFQ): 
${RFQ.map(r => `[ID: ${r.id}, Code: ${r.code}] Pregunta: ${r.q} | Guía Técnica: ${r.e}`).join("\n")}

DIRECTIVAS ESTRICTAS DE ZERO-HALLUCINATION:
1. Basa tu respuesta estrictamente en el documento adjunto (si el usuario provee uno).
2. Cita la página o la cláusula textual específica en tu respuesta siempre que extraigas información.
3. Si la respuesta a la pregunta no está en el documento adjunto proporcionado, ESTÁS FORZADO a declarar exactamente: "La normativa adjunta no cubre esta consulta". BAJO NINGUNA CIRCUNSTANCIA inventes, deduzcas o utilices conocimiento pre-entrenado para rellenar vacíos de información si el usuario pregunta sobre el documento.

Responde en español técnico claro (Latino). Usa formato estructurado.`;

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function askAria(prompt: string, context?: string, history: { role: string; content: string }[] = [], attachedDoc?: { data: string, mimeType: string, filename: string }) {
  try {
    const ai = getAI();
    
    // Formatting history for the SDK
    const contents: any[] = history.map(h => ({
      role: h.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: h.content }],
    }));

    const newPromptParts: any[] = [];
    if (attachedDoc) {
      newPromptParts.push({
        inlineData: {
          data: attachedDoc.data,
          mimeType: attachedDoc.mimeType
        }
      });
      newPromptParts.push({ text: `[Documento adjunto: ${attachedDoc.filename}]\n\n` });
    }
    newPromptParts.push({ text: prompt });

    contents.push({
      role: "user" as const,
      parts: newPromptParts
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: AI_SYSTEM + (context ? `\n\nCONTEXTO:\n${context}` : ""),
      }
    });

    return response.text || "No recibí una respuesta clara.";
  } catch (error) {
    console.error("Error calling ARIA:", error);
    return "Lo siento, tuve un problema al procesar tu solicitud. Asegúrate de que el documento no sea excesivamente grande, o verifica la conexión.";
  }
}
