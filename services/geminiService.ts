
import { GoogleGenAI, Type } from "@google/genai";
import { DetectionResult, ViolationType } from "../types";

// Always use named parameter for apiKey and use process.env.API_KEY directly as required.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeTrafficMedia = async (base64Media: string, mimeType: string): Promise<DetectionResult> => {
  // Use gemini-3-pro-preview for complex multimodal tasks involving OCR and traffic violation reasoning.
  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `
    You are an expert Traffic Enforcement AI. Your task is to analyze traffic CCTV footage (images or videos).
    1. Detect ALL vehicles and identify ALL Indian License Plate formats present (e.g., MH 12 AB 1234, DL 3C AY 5678).
    2. Check for multiple violations: Jumping red light, No helmet, Triple riding, Wrong lane driving, Illegal parking, Speeding.
    3. IMPORTANT: A single vehicle may have multiple violations (e.g., No Helmet AND Triple Riding). Return a separate detection entry for EACH violation found.
    4. If multiple vehicles are committing violations, return entries for ALL of them.
    5. Even if the quality is low (typical of CCTV), use context to infer characters on the number plate.
    6. Ensure the output is a valid JSON object matching the requested schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: "Analyze this traffic media and report all violations detected for all vehicles." },
          { inlineData: { data: base64Media, mimeType: mimeType } }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  vehicleNumber: { type: Type.STRING, description: "Extracted vehicle number plate" },
                  violationType: { 
                    type: Type.STRING, 
                    enum: Object.values(ViolationType),
                    description: "Specific traffic violation detected" 
                  },
                  confidence: { type: Type.NUMBER, description: "Confidence score from 0 to 1" },
                  reasoning: { type: Type.STRING, description: "Short explanation of the detection" }
                },
                required: ["vehicleNumber", "violationType", "confidence", "reasoning"]
              }
            }
          },
          required: ["detections"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from AI");
    
    return JSON.parse(resultText) as DetectionResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
