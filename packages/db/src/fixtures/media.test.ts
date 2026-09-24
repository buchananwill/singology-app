import { describe, expect, it } from "vitest";

import { mediaAssets } from "./media";

describe("fixture media", () => {
  it("derives each peaks file from its media file", () => {
    expect(mediaAssets.map((a) => a.peaksSrc)).toEqual([
      "/media/student-take-a.peaks.json",
      "/media/student-take-b.peaks.json",
      "/media/backing-track.peaks.json",
      "/media/coach-reply.peaks.json",
      "/media/test-pattern.peaks.json",
    ]);
  });

  it("has at least one video with an HLS rendition", () => {
    expect(mediaAssets.some((a) => a.kind === "video" && a.hlsSrc !== undefined)).toBe(true);
  });
});
