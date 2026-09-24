import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createFixtureData } from "@singology/db";
import { WaveformPeaksSchema } from "@singology/shared";
import { describe, expect, it } from "vitest";

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");

const TOLERANCE_SEC = 0.05;

const { coaches, mediaAssets } = createFixtureData(new Date("2026-09-23T12:00:00.000Z"));

function publicFile(url: string): string {
  return path.join(PUBLIC_DIR, ...url.split("/").filter(Boolean));
}

describe("fixture files in the public folder", () => {
  it.each(mediaAssets)("$id points at committed media and peaks files", (asset) => {
    expect(existsSync(publicFile(asset.src))).toBe(true);
    expect(existsSync(publicFile(asset.peaksSrc))).toBe(true);
    if (asset.hlsSrc !== undefined) {
      expect(existsSync(publicFile(asset.hlsSrc))).toBe(true);
    }
  });

  it.each(mediaAssets)("$id has the duration measured into its peaks file", (asset) => {
    const peaks = WaveformPeaksSchema.parse(
      JSON.parse(readFileSync(publicFile(asset.peaksSrc), "utf8")),
    );
    expect(asset.durationSec).toBeCloseTo(peaks.duration, 2);
    expect(peaks.peaks[0]).toHaveLength(peaks.peaks[1].length);
    const bins = peaks.peaks[0].length;
    expect(Math.abs(bins / peaks.peaksPerSecond - peaks.duration)).toBeLessThan(TOLERANCE_SEC);
  });

  it.each(coaches)("$id has its avatar in the public folder", (coach) => {
    expect(existsSync(publicFile(coach.avatarSrc))).toBe(true);
  });
});
