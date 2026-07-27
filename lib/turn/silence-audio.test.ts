import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const SILENCE_AUDIO = new URL(
  "../../public/audio/silence.wav",
  import.meta.url,
);

describe("playback unlock audio", () => {
  it("is a quarter-second mono PCM WAV containing only silence", async () => {
    const audio = await readFile(SILENCE_AUDIO);

    expect(audio.toString("ascii", 0, 4)).toBe("RIFF");
    expect(audio.toString("ascii", 8, 12)).toBe("WAVE");
    expect(audio.readUInt16LE(20)).toBe(1);
    expect(audio.readUInt16LE(22)).toBe(1);
    expect(audio.readUInt32LE(24)).toBe(16_000);
    expect(audio.readUInt16LE(34)).toBe(16);
    expect(audio.readUInt32LE(40)).toBe(8_000);
    expect(audio.subarray(44).every((sample) => sample === 0)).toBe(true);
  });
});
