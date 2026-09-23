import { describe, expect, it } from "vitest";

import { computePeaks, PEAKS_PER_SECOND } from "./computePeaks.ts";

describe("computePeaks", () => {
  it("returns 100 bins per second of audio by default", () => {
    const samples = new Float32Array(48_000 * 2);
    const { max, min } = computePeaks(samples, { sampleRate: 48_000 });
    expect(PEAKS_PER_SECOND).toBe(100);
    expect(max).toHaveLength(200);
    expect(min).toHaveLength(200);
  });

  it("takes the minimum and maximum sample of each bin", () => {
    // 4 samples per bin at 400 Hz / 100 peaks per second.
    const samples = Float32Array.from([0.1, -0.5, 0.25, 0, 0.9, 0.2, -0.1, -0.3]);
    const { max, min } = computePeaks(samples, { sampleRate: 400 });
    expect(max).toEqual([0.25, 0.9]);
    expect(min).toEqual([-0.5, -0.3]);
  });

  it("keeps a shorter final bin", () => {
    const samples = Float32Array.from([0.1, 0.2, 0.3, 0.4, -0.7]);
    const { max, min } = computePeaks(samples, { sampleRate: 400 });
    expect(max).toEqual([0.4, -0.7]);
    expect(min).toEqual([0.1, -0.7]);
  });

  it("handles fractional samples per bin without dropping samples", () => {
    // 150 samples per second / 100 peaks per second = 1.5 samples per bin.
    const samples = Float32Array.from([0.5, -0.5, 0.25]);
    const { max, min } = computePeaks(samples, { sampleRate: 150 });
    expect(max).toEqual([0.5, 0.25]);
    expect(min).toEqual([0.5, -0.5]);
  });

  it("clamps out-of-range samples to [-1, 1] and rounds to the given precision", () => {
    const samples = Float32Array.from([1.5, -2, 0.123456, -0.98765]);
    const { max, min } = computePeaks(samples, { sampleRate: 200, precision: 2 });
    expect(max).toEqual([1, 0.12]);
    expect(min).toEqual([-1, -0.99]);
  });

  it("never emits negative zero", () => {
    const samples = Float32Array.from([-0.0001, -0.0002]);
    const { max, min } = computePeaks(samples, { sampleRate: 200 });
    expect(Object.is(max[0], -0)).toBe(false);
    expect(Object.is(min[0], -0)).toBe(false);
  });

  it("returns no bins for empty input", () => {
    expect(computePeaks(new Float32Array(0), { sampleRate: 48_000 })).toEqual({ max: [], min: [] });
  });

  it("rejects a non-positive sample rate", () => {
    expect(() => computePeaks(new Float32Array(4), { sampleRate: 0 })).toThrow(RangeError);
  });
});
