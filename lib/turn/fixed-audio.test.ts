import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import bundledAudioJson from "./fixed-audio-base64.json";
import { fixedAudioManifest, getFixedOutcomeAudio } from "./fixed-audio";
import { ERROR_RESPONSES, FIXED_RESPONSES } from "./fixed-responses";

const expectedTexts = {
  disclosure: FIXED_RESPONSES.disclosure,
  "error-first": ERROR_RESPONSES.first,
  "error-repeated": ERROR_RESPONSES.repeated,
  nudge: FIXED_RESPONSES.nudge,
  redirect: FIXED_RESPONSES.redirect,
};
const audioNames = [
  "disclosure",
  "error-first",
  "error-repeated",
  "nudge",
  "redirect",
] as const;

describe("fixed audio", () => {
  it("matches every approved line to a hashed Talia MP3", async () => {
    const directory = join(process.cwd(), "public", "audio", "fixed");

    expect(
      Object.fromEntries(
        Object.entries(fixedAudioManifest.clips).map(([name, clip]) => [
          name,
          clip.text,
        ]),
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

    for (const name of audioNames) {
      const clip = fixedAudioManifest.clips[name];
      const audio = await readFile(join(directory, clip.file));

      expect(audio.length).toBe(clip.bytes);
      expect(createHash("sha256").update(audio).digest("hex")).toBe(
        clip.sha256,
      );
      expect(audio.subarray(0, 3).toString("ascii")).toBe("ID3");
      expect(Buffer.from(bundledAudioJson[name], "base64")).toEqual(audio);
    }
  });

  it("returns bundled server audio for every fixed outcome", () => {
    expect(getFixedOutcomeAudio("disclosure")).toBe(
      bundledAudioJson.disclosure,
    );
    expect(getFixedOutcomeAudio("nudge")).toBe(bundledAudioJson.nudge);
    expect(getFixedOutcomeAudio("redirect")).toBe(bundledAudioJson.redirect);
  });
});
