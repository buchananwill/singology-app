import { clamp } from "./clamp.ts";

export const PEAKS_PER_SECOND = 100;

export interface MinMaxPeaks {
  /** Largest sample in each bin. */
  max: number[];
  /** Smallest sample in each bin. */
  min: number[];
}

export interface ComputePeaksOptions {
  sampleRate: number;
  /** Bins per second of audio; defaults to 100. */
  peaksPerSecond?: number;
  /** Decimal places kept in the output, to keep the JSON small; defaults to 3. */
  precision?: number;
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  // `+ 0` turns a rounded -0 into 0 so the JSON never contains "-0".
  return Math.round(value * factor) / factor + 0;
}

/** The final bin may be shorter than the rest. */
export function computePeaks(samples: Float32Array, options: ComputePeaksOptions): MinMaxPeaks {
  const peaksPerSecond = options.peaksPerSecond ?? PEAKS_PER_SECOND;
  const precision = options.precision ?? 3;
  if (!(options.sampleRate > 0) || !(peaksPerSecond > 0)) {
    throw new RangeError("sampleRate and peaksPerSecond must be positive");
  }
  const samplesPerBin = options.sampleRate / peaksPerSecond;
  const binCount = Math.ceil(samples.length / samplesPerBin);
  const max: number[] = new Array<number>(binCount);
  const min: number[] = new Array<number>(binCount);

  for (let bin = 0; bin < binCount; bin++) {
    const start = Math.floor(bin * samplesPerBin);
    const end = Math.min(samples.length, Math.floor((bin + 1) * samplesPerBin));
    let hi = -Infinity;
    let lo = Infinity;
    for (let i = start; i < end; i++) {
      const s = samples[i] ?? 0;
      if (s > hi) hi = s;
      if (s < lo) lo = s;
    }
    if (end <= start) {
      hi = 0;
      lo = 0;
    }
    max[bin] = round(clamp(hi, -1, 1), precision);
    min[bin] = round(clamp(lo, -1, 1), precision);
  }
  return { max, min };
}
