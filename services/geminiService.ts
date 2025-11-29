
import { GoogleGenAI } from "@google/genai";
import { Tile, TileType } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("No API_KEY found in process.env");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateLore = async (
  playerPos: { x: number, y: number },
  nearbyTiles: Tile[],
  timeOfDay: string
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "The Oracle is silent (API Key missing).";

  // Summarize surroundings
  const counts: Record<string, number> = {};
  nearbyTiles.forEach(t => {
    counts[t.type] = (counts[t.type] || 0) + 1;
  });

  const surroundingsDesc = Object.entries(counts)
    .map(([type, count]) => `${count} ${type.toLowerCase()} tiles`)
    .join(', ');

  const prompt = `
    You are the Oracle of a 2D top-down sandbox game. 
    The player is currently standing at coordinate [${playerPos.x}, ${playerPos.y}].
    It is currently ${timeOfDay}.
    Surroundings immediately nearby: ${surroundingsDesc}.
    
    Generate a short, atmospheric, single-sentence description of what the player feels or sees. 
    It can be mysterious, peaceful, or foreboding. 
    Do not use markdown. Keep it under 30 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "The wind whispers... but says nothing.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The connection to the ethereal plane is broken.";
  }
};

export const identifyObject = async (tileType: TileType): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Unknown object.";

    const prompt = `
      Describe a "${tileType}" in a fantasy RPG context in 10 words or less. 
      Be creative.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "A mysterious object.";
    } catch (error) {
        return "An object defying identification.";
    }
};

export const generateTexture = async (tileType: string, style: string): Promise<string | null> => {
    const ai = getAiClient();
    if (!ai) return null;

    const prompt = `
        Generate a single seamless pixel art texture for a top-down 2D game.
        Subject: ${tileType}.
        Style: ${style || 'Standard detailed pixel art'}.
        View: Top-down.
        Resolution: 64x64.
        Do not include any UI, borders, or text. Just the tile texture square.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt,
        });
        
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Texture Gen Error", error);
        return null;
    }
}
