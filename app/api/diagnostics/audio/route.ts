const SAMPLE_RATE = 16_000;
const BYTES_PER_SAMPLE = 2;
const TONE_DURATION_SECONDS = 6;
const STREAM_FIRST_SECONDS = 1;
const STREAM_CHUNK_SECONDS = 0.5;
const STREAM_CHUNK_DELAY_MS = 500;

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function createWav(durationSeconds: number, frequency: number) {
  const sampleCount = SAMPLE_RATE * durationSeconds;
  const dataLength = sampleCount * BYTES_PER_SAMPLE;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * BYTES_PER_SAMPLE, true);
  view.setUint16(32, BYTES_PER_SAMPLE, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataLength, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const fadeSamples = SAMPLE_RATE * 0.02;
    const fadeIn = Math.min(1, index / fadeSamples);
    const fadeOut = Math.min(1, (sampleCount - index) / fadeSamples);
    const amplitude = frequency === 0 ? 0 : 0.18 * fadeIn * fadeOut;
    const sample = Math.sin((2 * Math.PI * frequency * index) / SAMPLE_RATE);
    view.setInt16(
      44 + index * BYTES_PER_SAMPLE,
      sample * amplitude * 0x7fff,
      true,
    );
  }

  return new Uint8Array(buffer);
}

function audioHeaders(length: number) {
  return {
    "Cache-Control": "no-store",
    "Content-Length": String(length),
    "Content-Type": "audio/wav",
  };
}

function streamAudio(wav: Uint8Array) {
  const firstChunkEnd =
    44 + SAMPLE_RATE * BYTES_PER_SAMPLE * STREAM_FIRST_SECONDS;
  const laterChunkLength =
    SAMPLE_RATE * BYTES_PER_SAMPLE * STREAM_CHUNK_SECONDS;
  let offset = firstChunkEnd;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(wav.slice(0, firstChunkEnd));

      const enqueueNext = () => {
        if (offset >= wav.length) {
          controller.close();
          return;
        }

        const end = Math.min(offset + laterChunkLength, wav.length);
        controller.enqueue(wav.slice(offset, end));
        offset = end;
        timeout = setTimeout(enqueueNext, STREAM_CHUNK_DELAY_MS);
      };

      timeout = setTimeout(enqueueNext, STREAM_CHUNK_DELAY_MS);
    },
    cancel() {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
    },
  });
}

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const mode = new URL(request.url).searchParams.get("mode");

  if (mode === "silence") {
    const wav = createWav(0.25, 0);
    return new Response(wav, { headers: audioHeaders(wav.length) });
  }

  const wav = createWav(TONE_DURATION_SECONDS, 440);

  if (mode === "atomic") {
    return new Response(wav, { headers: audioHeaders(wav.length) });
  }

  if (mode === "stream") {
    return new Response(streamAudio(wav), {
      headers: audioHeaders(wav.length),
    });
  }

  return new Response(null, { status: 400 });
}
