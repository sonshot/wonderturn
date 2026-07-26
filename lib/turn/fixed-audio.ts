import { z } from "zod";

import bundledAudioJson from "./fixed-audio-base64.json";
import manifestJson from "../../public/audio/fixed/manifest.json";
import type { FixedOutcomeKind } from "./fixed-responses";

const audioNameSchema = z.enum([
  "disclosure",
  "error-first",
  "error-repeated",
  "nudge",
  "redirect",
]);

const clipSchema = z
  .object({
    bytes: z.number().int().positive().max(2_000_000),
    file: z.string().regex(/^[a-z-]+\.mp3$/),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    text: z.string().min(1),
  })
  .strict();

export const fixedAudioManifestSchema = z
  .object({
    clips: z
      .object({
        disclosure: clipSchema,
        "error-first": clipSchema,
        "error-repeated": clipSchema,
        nudge: clipSchema,
        redirect: clipSchema,
      })
      .strict(),
    modelId: z.literal("eleven_flash_v2_5"),
    voiceId: z.literal("OZ0L6eISlOejga3XjDFt"),
    voiceName: z.literal("Talia"),
  })
  .strict();

const bundledAudioSchema = z.record(audioNameSchema, z.base64());

export const fixedAudioManifest = fixedAudioManifestSchema.parse(manifestJson);
const bundledAudio = bundledAudioSchema.parse(bundledAudioJson);

export function getFixedOutcomeAudio(kind: FixedOutcomeKind) {
  return bundledAudio[kind];
}
