/**
 * Writes wavesurfer-compatible peaks JSON next to media files (spec decision 23),
 * the prototype of the D21 media job.
 *
 *   pnpm --filter @singology/media-jobs peaks            # every .m4a/.mp4 in apps/web/public/media
 *   pnpm --filter @singology/media-jobs peaks <file>...  # specific inputs, any format ffmpeg reads
 *
 * ffmpeg decodes each input to mono 32-bit float PCM; computePeaks (pure,
 * unit-tested) reduces it to min/max bins; the result is written as
 * `<name>.peaks.json` in the shape of `WaveformPeaksSchema` (packages/shared).
 */
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { WaveformPeaks } from "@singology/shared";

import { computePeaks, PEAKS_PER_SECOND } from "./computePeaks.ts";
import { MEDIA_DIR, probeDurationSec, runFfmpegToBuffer } from "./ffmpeg.ts";

const DECODE_SAMPLE_RATE = 48_000;
const DEFAULT_EXTENSIONS = new Set([".m4a", ".mp4"]);

async function decodeMono(file: string): Promise<Float32Array> {
  const pcm = await runFfmpegToBuffer(
    [
      ["-i", file],
      ["-vn"],
      ["-ac", "1"],
      ["-ar", String(DECODE_SAMPLE_RATE)],
      ["-f", "f32le"],
      ["pipe:1"],
    ].flat(),
  );
  // Copy into an aligned buffer: Node's Buffer may sit at an odd offset in its pool.
  const aligned = new ArrayBuffer(pcm.byteLength - (pcm.byteLength % 4));
  new Uint8Array(aligned).set(pcm.subarray(0, aligned.byteLength));
  return new Float32Array(aligned);
}

export function peaksPathFor(file: string): string {
  const { dir, name } = path.parse(file);
  return path.join(dir, `${name}.peaks.json`);
}

async function writePeaks(file: string): Promise<void> {
  const samples = await decodeMono(file);
  const { max, min } = computePeaks(samples, {
    sampleRate: DECODE_SAMPLE_RATE,
    peaksPerSecond: PEAKS_PER_SECOND,
  });
  const peaksFile: WaveformPeaks = {
    version: 1,
    peaksPerSecond: PEAKS_PER_SECOND,
    duration: Number((await probeDurationSec(file)).toFixed(3)),
    peaks: [max, min],
  };
  const out = peaksPathFor(file);
  await writeFile(out, `${JSON.stringify(peaksFile)}\n`);
  console.log(`${path.basename(out)}\t${max.length} bins\t${peaksFile.duration} s`);
}

async function defaultInputs(): Promise<string[]> {
  const entries = await readdir(MEDIA_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && DEFAULT_EXTENSIONS.has(path.extname(e.name)))
    .map((e) => path.join(MEDIA_DIR, e.name))
    .sort();
}

const args = process.argv.slice(2);
const inputs = args.length > 0 ? args.map((a) => path.resolve(a)) : await defaultInputs();
for (const file of inputs) {
  await writePeaks(file);
}
