import { mkdir, writeFile } from "node:fs/promises";

const SAMPLE_RATE = 16_000;
const DURATION_SECONDS = 0.25;
const BYTES_PER_SAMPLE = 2;
const sampleCount = SAMPLE_RATE * DURATION_SECONDS;
const dataLength = sampleCount * BYTES_PER_SAMPLE;
const wav = Buffer.alloc(44 + dataLength);

function writeAscii(offset, value) {
  wav.write(value, offset, "ascii");
}

writeAscii(0, "RIFF");
wav.writeUInt32LE(36 + dataLength, 4);
writeAscii(8, "WAVE");
writeAscii(12, "fmt ");
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(SAMPLE_RATE, 24);
wav.writeUInt32LE(SAMPLE_RATE * BYTES_PER_SAMPLE, 28);
wav.writeUInt16LE(BYTES_PER_SAMPLE, 32);
wav.writeUInt16LE(16, 34);
writeAscii(36, "data");
wav.writeUInt32LE(dataLength, 40);

const output = new URL("../public/audio/silence.wav", import.meta.url);
await mkdir(new URL("../public/audio/", import.meta.url), { recursive: true });
await writeFile(output, wav);
