import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { WaveformPeaksSchema } from "@singology/shared";
import { describe, expect, it } from "vitest";

import { mediaAssets } from "./media";

/** The web app's public folder, where `/media/...` URLs are served from. */
const PUBLIC_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../apps/web/public",
);

function publicFile(url: string): string {
  return path.join(PUBLIC_DIR, ...url.split("/").filter(Boolean));
}

describe("fixture media", () => {
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
    // One min/max pair per 1/100 s, within a bin of the container duration.
    expect(peaks.peaks[0]).toHaveLength(peaks.peaks[1].length);
    expect(Math.abs(peaks.peaks[0].length - peaks.duration * peaks.peaksPerSecond)).toBeLessThan(
      peaks.peaksPerSecond * 0.05,
    );
  });

  it("has at least one video with an HLS rendition (spec decision 21)", () => {
    expect(mediaAssets.some((a) => a.kind === "video" && a.hlsSrc !== undefined)).toBe(true);
  });
});
