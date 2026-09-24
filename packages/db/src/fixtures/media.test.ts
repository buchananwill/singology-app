import { describe, expect, it } from "vitest";

import { mediaAssets } from "./media";

describe("fixture media", () => {
  it("has at least one video with an HLS rendition (spec decision 21)", () => {
    expect(mediaAssets.some((a) => a.kind === "video" && a.hlsSrc !== undefined)).toBe(true);
  });
});
