import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { z } from "zod";

import manifestJson from "../../public/audio/fixed/manifest.json";
import { ERROR_RESPONSES, FIXED_RESPONSES } from "./fixed-responses";

const clipSchema = z
  .object({
    bytes: z.number().int().positive().max(2_000_000),
    file: z.string().regex(/^[a-z-]+\.mp3$/),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    text: z.string().min(1),
  })
  .strict();

const manifestSchema = z
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

const expectedTexts = {
  disclosure: FIXED_RESPONSES.disclosure,
  "error-first": ERROR_RESPONSES.first,
  "error-repeated": ERROR_RESPONSES.repeated,
  nudge: FIXED_RESPONSES.nudge,
  redirect: FIXED_RESPONSES.redirect,
};

describe("fixed audio", () => {
  it("matches every approved line to a hashed Talia MP3", async () => {
    const manifest = manifestSchema.parse(manifestJson);
    const directory = join(process.cwd(), "public", "audio", "fixed");

    expect(
      Object.fromEntries(
        Object.entries(manifest.clips).map(([name, clip]) => [name, clip.text]),
      ),
    ).toEqual(expectedTexts);
    await expect(
      readdir(directory).then((files) => files.sort()),
    ).resolves.toEqual([
      "disclosure.mp3",
      "error-first.mp3",
      "error-repeated.mp3",
      "manifest.json",
      "nudge.mp3",
      "redirect.mp3",
    ]);

    for (const clip of Object.values(manifest.clips)) {
      const audio = await readFile(join(directory, clip.file));

      expect(audio.length).toBe(clip.bytes);
      expect(createHash("sha256").update(audio).digest("hex")).toBe(
        clip.sha256,
      );
      expect(audio.subarray(0, 3).toString("ascii")).toBe("ID3");
    }
  });
});
