import { generateText, Output } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { z } from "zod/v4";

export interface LayerPrompt {
  name: string;
  prompt: string;
  type: "sfx" | "music";
}

export interface DecompositionResult {
  durationMs: number;
  layers: LayerPrompt[];
  source: "ai" | "fallback";
  title: string;
}

const decompositionSchema = z.object({
  title: z.string().min(1).max(80),
  layers: z
    .array(
      z.object({
        name: z.string().min(1).max(40),
        prompt: z.string().min(1).max(200),
        type: z.literal("sfx"),
      })
    )
    .min(1),
});

function buildFallbackDecomposition(
  description: string,
  layerCount: number
): Omit<DecompositionResult, "durationMs" | "source"> {
  return {
    title: description.slice(0, 50),
    layers: Array.from({ length: layerCount }, (_, i) => ({
      name: layerCount === 1 ? "Ambient" : `Ambient ${i + 1}`,
      prompt: description,
      type: "sfx" as const,
    })),
  };
}

/**
 * Scene Decomposition Service — takes a scene description and desired layer count,
 * returns a structured array of layer prompts via Workers AI.
 */
export async function decomposeScene(
  ai: Ai,
  description: string,
  layerCount: number
): Promise<DecompositionResult> {
  const startedAt = Date.now();
  const workersai = createWorkersAI({ binding: ai });

  console.info("decomposeScene started", {
    descriptionLength: description.length,
    layerCount,
  });

  try {
    const { output } = await generateText({
      model: workersai("@cf/meta/llama-3.1-8b-instruct-fast"),
      output: Output.object({
        schema: decompositionSchema,
      }),
      temperature: 0.2,
      prompt: `You are a professional sound designer. Given this scene description, decompose it into exactly ${layerCount} distinct ambient sound effect layers that together create a rich, immersive soundscape.

Each layer should be:
- A specific, distinct sound (not overlapping with other layers)
- Described in 3-10 words, optimized for a sound effects generator
- Suitable for seamless looping as ambient background audio
- A sound effect only, never music, score, melody, beat, or soundtrack

Also generate a short, evocative title for this soundscape (3-6 words).

Scene: "${description}"
`,
    });

    const result: DecompositionResult = {
      durationMs: Date.now() - startedAt,
      source: "ai",
      title: output.title || description.slice(0, 50),
      layers: output.layers.slice(0, layerCount).map((l) => ({
        name: l.name || l.prompt.slice(0, 20) || "Sound",
        prompt: l.prompt || description,
        type: "sfx" as const,
      })),
    };

    console.info("decomposeScene completed", {
      durationMs: result.durationMs,
      layerCount: result.layers.length,
      title: result.title,
    });

    return result;
  } catch (error) {
    const fallback: DecompositionResult = {
      ...buildFallbackDecomposition(description, layerCount),
      durationMs: Date.now() - startedAt,
      source: "fallback",
    };

    console.warn("decomposeScene fell back to generic layers", {
      durationMs: fallback.durationMs,
      error: error instanceof Error ? error.message : String(error),
      layerCount,
    });

    return fallback;
  }
}
