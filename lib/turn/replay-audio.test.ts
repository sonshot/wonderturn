import { describe, expect, it } from "vitest";

import { audioBlobFromBase64 } from "./replay-audio";

describe("replay audio", () => {
  it("decodes validated base64 into a compressed MPEG blob", async () => {
    const blob = audioBlobFromBase64("AAEC/w==");

    expect(blob.type).toBe("audio/mpeg");
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(
      new Uint8Array([0, 1, 2, 255]),
    );
  });
});
