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
): Promise<{ r2Key: string; duration: number }> {
  const client = createClient(apiKey);
  const audio = await client.textToSoundEffects.convert({
    text: prompt,
    durationSeconds: 10,
    promptInfluence: 0.5,
  });

  const buffer = await new Response(audio).arrayBuffer();
  const r2Key = `sfx/${layerId}.mp3`;

  await bucket.put(r2Key, buffer, {
    httpMetadata: { contentType: "audio/mpeg" },
  });

  return { r2Key, duration: 10 };
}

export async function generateMusic(
  apiKey: string,
  bucket: R2Bucket,
  layerId: string,
  prompt: string
): Promise<{ r2Key: string; duration: number }> {
  const client = createClient(apiKey);
  const audio = await client.music.compose({
    prompt: `Ambient background music: ${prompt}`,
    musicLengthMs: 30_000,
    forceInstrumental: true,
    outputFormat: "mp3_44100_128",
  });

  const buffer = await new Response(audio).arrayBuffer();
  const r2Key = `music/${layerId}.mp3`;

  await bucket.put(r2Key, buffer, {
    httpMetadata: { contentType: "audio/mpeg" },
  });

  return { r2Key, duration: 30 };
}
