import { createClient } from "../lib/elevenlabs";

/**
 * Audio Generation Service — wraps ElevenLabs APIs.
 * Streams audio into R2 storage and returns the R2 key.
 */

export async function generateSfx(
  apiKey: string,
  bucket: R2Bucket,
  layerId: string,
  prompt: string
): Promise<{ duration: number; generationMs: number; r2Key: string }> {
  const startedAt = Date.now();
  const client = createClient(apiKey);
  const audio = await client.textToSoundEffects.convert({
    text: prompt,
    durationSeconds: 10,
    promptInfluence: 0.5,
  });

  const r2Key = `sfx/${layerId}.mp3`;

  await bucket.put(r2Key, audio, {
    httpMetadata: { contentType: "audio/mpeg" },
  });

  console.info("generateSfx completed", {
    durationMs: Date.now() - startedAt,
    layerId,
    r2Key,
  });

  return { r2Key, duration: 10, generationMs: Date.now() - startedAt };
}

export async function generateMusic(
  apiKey: string,
  bucket: R2Bucket,
  layerId: string,
  prompt: string
): Promise<{ duration: number; generationMs: number; r2Key: string }> {
  const startedAt = Date.now();
  const client = createClient(apiKey);
  const audio = await client.music.compose({
    prompt: `Ambient background music: ${prompt}`,
    musicLengthMs: 30_000,
    forceInstrumental: true,
    outputFormat: "mp3_44100_128",
  });

  const r2Key = `music/${layerId}.mp3`;

  await bucket.put(r2Key, audio, {
    httpMetadata: { contentType: "audio/mpeg" },
  });

  console.info("generateMusic completed", {
    durationMs: Date.now() - startedAt,
    layerId,
    r2Key,
  });

  return { r2Key, duration: 30, generationMs: Date.now() - startedAt };
}
