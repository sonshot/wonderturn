import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadEnvFile } from "node:process";

import {
  ERROR_RESPONSES,
  FIXED_RESPONSES,
} from "../lib/turn/fixed-responses.ts";
import { synthesizeSpeech } from "../lib/turn/elevenlabs.ts";

const MODEL_ID = "eleven_flash_v2_5";
const VOICE_ID = "OZ0L6eISlOejga3XjDFt";
const VOICE_NAME = "Talia";
const OUTPUT_DIRECTORY = join(process.cwd(), "public", "audio", "fixed");
const BUNDLE_PATH = join(
  process.cwd(),
  "lib",
  "turn",
  "fixed-audio-base64.json",
);
const BUNDLE_ONLY = process.argv.includes("--bundle-only");

const clips = [
  ["disclosure", FIXED_RESPONSES.disclosure],
  ["nudge", FIXED_RESPONSES.nudge],
  ["redirect", FIXED_RESPONSES.redirect],
  ["error-first", ERROR_RESPONSES.first],
  ["error-repeated", ERROR_RESPONSES.repeated],
];

await mkdir(OUTPUT_DIRECTORY, { recursive: true });

if (!BUNDLE_ONLY) {
  loadEnvFile(".env.local");

  if (process.env.ELEVENLABS_API_KEY === undefined) {
    throw new Error("ELEVENLABS_API_KEY is required");
  }

  const manifestClips = {};

  for (const [name, text] of clips) {
    const encodedAudio = await synthesizeSpeech(
      text,
      AbortSignal.timeout(30_000),
      {
        ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
        ELEVENLABS_MODEL_ID: MODEL_ID,
        ELEVENLABS_VOICE_ID: VOICE_ID,
      },
    );
    const audio = Buffer.from(encodedAudio, "base64");
    const file = `${name}.mp3`;

    await writeFile(join(OUTPUT_DIRECTORY, file), audio);
    manifestClips[name] = {
      bytes: audio.length,
      file,
      sha256: createHash("sha256").update(audio).digest("hex"),
      text,
    };
    process.stdout.write(`Generated ${file} (${audio.length} bytes)\n`);
  }

  await writeFile(
    join(OUTPUT_DIRECTORY, "manifest.json"),
    `${JSON.stringify(
      {
        clips: manifestClips,
        modelId: MODEL_ID,
        voiceId: VOICE_ID,
        voiceName: VOICE_NAME,
      },
      null,
      2,
    )}\n`,
  );
}

const manifest = JSON.parse(
  await readFile(join(OUTPUT_DIRECTORY, "manifest.json"), "utf8"),
);
const bundledAudio = {};

for (const [name, clip] of Object.entries(manifest.clips)) {
  const audio = await readFile(join(OUTPUT_DIRECTORY, clip.file));
  bundledAudio[name] = audio.toString("base64");
}

await writeFile(BUNDLE_PATH, `${JSON.stringify(bundledAudio, null, 2)}\n`);
process.stdout.write(`Bundled ${Object.keys(bundledAudio).length} clips\n`);
