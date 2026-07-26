import { Buffer } from "node:buffer";

import { z } from "zod";

const ELEVENLABS_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";
const OUTPUT_FORMAT = "mp3_44100_128";
const MAX_AUDIO_BYTES = 2_000_000;
const SYNTHESIS_SEED = 20_260_726;
const VOICE_SETTINGS = {
  similarity_boost: 0.75,
  speed: 1,
  stability: 0.5,
  style: 0,
  use_speaker_boost: true,
} as const;

const elevenLabsConfigSchema = z.object({
  ELEVENLABS_API_KEY: z.string().trim().min(1),
  ELEVENLABS_MODEL_ID: z.literal("eleven_flash_v2_5"),
  ELEVENLABS_VOICE_ID: z
    .string()
    .trim()
    .min(1)
    .regex(/^[A-Za-z0-9_-]+$/),
});

const audioContentTypeSchema = z.string().regex(/^audio\/mpeg(?:\s*;.*)?$/i);

type Environment = Record<string, string | undefined>;
type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export function readElevenLabsConfig(environment: Environment = process.env) {
  return elevenLabsConfigSchema.parse(environment);
}

export async function synthesizeSpeech(
  text: string,
  signal: AbortSignal,
  environment: Environment = process.env,
  fetcher: Fetcher = fetch,
) {
  const config = readElevenLabsConfig(environment);
  const url = new URL(
    `${ELEVENLABS_ENDPOINT}/${encodeURIComponent(config.ELEVENLABS_VOICE_ID)}`,
  );
  url.searchParams.set("output_format", OUTPUT_FORMAT);
  const response = await fetcher(url, {
    body: JSON.stringify({
      apply_text_normalization: "auto",
      language_code: "en",
      model_id: config.ELEVENLABS_MODEL_ID,
      seed: SYNTHESIS_SEED,
      text,
      voice_settings: VOICE_SETTINGS,
    }),
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": config.ELEVENLABS_API_KEY,
    },
    method: "POST",
    signal,
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs returned ${response.status}`);
  }

  audioContentTypeSchema.parse(response.headers.get("content-type"));
  const audio = new Uint8Array(await response.arrayBuffer());

  if (audio.length === 0 || audio.length > MAX_AUDIO_BYTES) {
    throw new Error("ElevenLabs returned an invalid audio size");
  }

  return Buffer.from(audio).toString("base64");
}
