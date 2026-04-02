import { createWorkersAI } from "workers-ai-provider";
import { generateText } from "ai";

export interface LayerPrompt {
  name: string;
  prompt: string;
  type: "sfx" | "music";
}

/**
 * Scene Decomposition Service — takes a scene description and desired layer count,
 * returns a structured array of layer prompts via Workers AI.
 */
export async function decomposeScene(
  ai: Ai,
  description: string,
  layerCount: number
): Promise<{ title: string; layers: LayerPrompt[] }> {
  const workersai = createWorkersAI({ binding: ai });

  const { text } = await generateText({
    model: workersai("@cf/moonshotai/kimi-k2.5"),
    prompt: `You are a professional sound designer. Given this scene description, decompose it into exactly ${layerCount} distinct ambient sound layers that together create a rich, immersive soundscape.

Each layer should be:
- A specific, distinct sound (not overlapping with other layers)
- Described in 3-10 words, optimized for a sound effects generator
- Suitable for seamless looping as ambient background audio

Also generate a short, evocative title for this soundscape (3-6 words).

Scene: "${description}"

Respond with ONLY valid JSON, no markdown fences:
{"title": "...", "layers": [{"name": "Short Name", "prompt": "detailed sound description for generator", "type": "sfx"}, ...]}`
  });

  try {
    const cleaned = text.replace(/```[\s\S]*?```/g, "").trim();
    const jsonStr = cleaned.match(/\{[\s\S]*\}/)?.[0] ?? "";
    const parsed = JSON.parse(jsonStr);
    return {
      title: parsed.title || description.slice(0, 50),
      layers: (parsed.layers || []).slice(0, layerCount).map((l: any) => ({
        name: l.name || l.prompt?.slice(0, 20) || "Sound",
        prompt: l.prompt || description,
        type: l.type === "music" ? "music" : ("sfx" as const)
      }))
    };
  } catch {
    return {
      title: description.slice(0, 50),
      layers: [{ name: "Ambient", prompt: description, type: "sfx" as const }]
    };
  }
}
