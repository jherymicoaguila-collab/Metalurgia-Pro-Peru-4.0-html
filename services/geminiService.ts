
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function askCareerAdvice(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: `Eres "METALURGIA LAB AI 2026", un consultor de carrera de élite especializado en minería peruana.
        
        REGLAS DE RESPUESTA (MÁXIMO ORDEN):
        1. LENGUAJE CLARO: Evita tecnicismos innecesarios. Explica conceptos complejos de forma sencilla.
        2. ESTRUCTURA VISUAL:
           - Usa Títulos Grandes (###) para separar temas.
           - Usa Listas de Viñetas (•) para beneficios o requisitos. No escribas párrafos largos.
           - Deja una línea en blanco entre cada sección.
        3. DATOS CRÍTICOS:
           - Los salarios y porcentajes deben ir en **negrita y resaltados**. Ejemplo: **S/ 15,000**.
           - Siempre menciona proyecciones para el año **2026**.
        4. SECCIONES OBLIGATORIAS:
           ### 📈 Panorama del Sector 2026
           ### 💰 Ingresos y Beneficios
           ### 🚀 Guía de Crecimiento
        
        Tu objetivo es que el usuario se sienta emocionado y bien informado al leer.`,
        tools: [{ googleSearch: {} }],
      },
    });

    return { 
      text: response.text || "La conexión con el núcleo de datos 2026 falló.", 
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
        title: chunk.web?.title || "Fuentes Oficiales 2026",
        uri: chunk.web?.uri || "#"
      })) || [] 
    };
  } catch (error) {
    console.error("Error in Gemini Service:", error);
    return { text: "Error de sistema. El servidor está procesando demasiada data.", sources: [] };
  }
}

export async function searchJobs(query: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Encuentra las vacantes más recientes para: ${query} en Perú para el año 2026. Prioriza empresas mineras y metalúrgicas.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `Eres un buscador de talento experto para el 2026. 
        PRESENTA LOS RESULTADOS ASÍ:
        - Usa un formato de lista numerada.
        - Indica: 🏢 Empresa | 📍 Ubicación | 🎯 Puesto.
        - Añade una breve descripción de **máximo 2 líneas** por puesto.
        - Sé extremadamente ordenado y fácil de leer.`
      },
    });

    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
        title: chunk.web?.title || "Bolsa de Trabajo 2026",
        uri: chunk.web?.uri || "#"
      })) || []
    };
  } catch (error) {
    console.error("Error searching jobs:", error);
    return { text: "No se pudieron recuperar vacantes en este momento.", sources: [] };
  }
}

export async function editImage(base64ImageData: string, prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData.split(',')[1],
              mimeType: 'image/png',
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from model");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
}
