import { describe, expect, it, vi } from "vitest";

import { readElevenLabsConfig, synthesizeSpeech } from "./elevenlabs";

const environment = {
  ELEVENLABS_API_KEY: "test-api-key",
  ELEVENLABS_MODEL_ID: "eleven_flash_v2_5",
  ELEVENLABS_VOICE_ID: "voice_123",
} as const;

describe("ElevenLabs", () => {
  it("parses only supported synthesis configuration", () => {
    expect(readElevenLabsConfig(environment)).toEqual(environment);
    expect(() =>
      readElevenLabsConfig({
        ...environment,
        ELEVENLABS_MODEL_ID: "unsupported",
      }),
    ).toThrow();
  });

  it("returns validated MP3 audio as base64", async () => {
    let requestUrl: RequestInfo | URL | undefined;
    let requestInit: RequestInit | undefined;
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        requestUrl = input;
        requestInit = init;

        return new Response(new Uint8Array([1, 2, 3]).buffer, {
          headers: { "Content-Type": "audio/mpeg" },
        });
      },
    );

    await expect(
      synthesizeSpeech(
        "A complete reply.",
        new AbortController().signal,
        environment,
        fetcher,
      ),
    ).resolves.toBe("AQID");
    expect(fetcher).toHaveBeenCalledOnce();

    expect(String(requestUrl)).toBe(
      "https://api.elevenlabs.io/v1/text-to-speech/voice_123?output_format=mp3_44100_128",
    );
    expect(requestInit?.headers).toEqual({
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": "test-api-key",
    });
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      apply_text_normalization: "auto",
      language_code: "en",
      model_id: "eleven_flash_v2_5",
      seed: 20_260_726,
      text: "A complete reply.",
      voice_settings: {
        similarity_boost: 0.75,
        speed: 1,
        stability: 0.5,
        style: 0,
        use_speaker_boost: true,
      },
    });
  });

  it("fails fast before a request when configuration is incomplete", async () => {
    const fetcher = vi.fn();

    await expect(
      synthesizeSpeech(
        "A complete reply.",
        new AbortController().signal,
        {
          ELEVENLABS_API_KEY: "test-api-key",
          ELEVENLABS_MODEL_ID: "eleven_flash_v2_5",
        },
        fetcher,
      ),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects upstream failures and non-audio responses", async () => {
    await expect(
      synthesizeSpeech(
        "A complete reply.",
        new AbortController().signal,
        environment,
        async () => new Response(null, { status: 429 }),
      ),
    ).rejects.toThrow("returned 429");
    await expect(
      synthesizeSpeech(
        "A complete reply.",
        new AbortController().signal,
        environment,
        async () =>
          new Response("not audio", {
            headers: { "Content-Type": "text/plain" },
          }),
      ),
    ).rejects.toThrow();
  });
});
