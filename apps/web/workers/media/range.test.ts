import { describe, expect, it } from "vitest";

import { mediaContentType, parseRange } from "./range";

const TOTAL = 1000;

describe("parseRange", () => {
  it("serves the full body when there is no Range header", () => {
    expect(parseRange(null, TOTAL)).toEqual({ kind: "full", reason: "absent" });
    expect(parseRange("  ", TOTAL)).toEqual({ kind: "full", reason: "absent" });
  });

  it("reads a normal start-end range", () => {
    expect(parseRange("bytes=0-99", TOTAL)).toEqual({ kind: "partial", start: 0, end: 99 });
    expect(parseRange("bytes=500-500", TOTAL)).toEqual({ kind: "partial", start: 500, end: 500 });
    expect(parseRange(" Bytes = 10 - 19 ", TOTAL)).toEqual({ kind: "partial", start: 10, end: 19 });
  });

  it("clamps an end beyond the body", () => {
    expect(parseRange("bytes=900-5000", TOTAL)).toEqual({ kind: "partial", start: 900, end: 999 });
  });

  it("reads an open-ended range", () => {
    expect(parseRange("bytes=250-", TOTAL)).toEqual({ kind: "partial", start: 250, end: 999 });
    expect(parseRange("bytes=0-", TOTAL)).toEqual({ kind: "partial", start: 0, end: 999 });
  });

  it("reads a suffix range", () => {
    expect(parseRange("bytes=-100", TOTAL)).toEqual({ kind: "partial", start: 900, end: 999 });
    expect(parseRange("bytes=-5000", TOTAL)).toEqual({ kind: "partial", start: 0, end: 999 });
  });

  it("reports out-of-bounds ranges as unsatisfiable", () => {
    expect(parseRange("bytes=1000-1100", TOTAL)).toEqual({ kind: "unsatisfiable" });
    expect(parseRange("bytes=1000-", TOTAL)).toEqual({ kind: "unsatisfiable" });
    expect(parseRange("bytes=-0", TOTAL)).toEqual({ kind: "unsatisfiable" });
    expect(parseRange("bytes=0-0", 0)).toEqual({ kind: "unsatisfiable" });
    expect(parseRange("bytes=-10", 0)).toEqual({ kind: "unsatisfiable" });
  });

  it("ignores malformed headers", () => {
    const malformed = [
      "bytes",
      "bytes=",
      "bytes=-",
      "bytes=abc-def",
      "bytes=10",
      "bytes=20-10",
      "bytes=1.5-2",
      "bytes=--5",
      "items=0-99",
      "0-99",
      "bytes=99999999999999999999-",
    ];
    for (const header of malformed) {
      expect(parseRange(header, TOTAL), header).toEqual({ kind: "full", reason: "malformed" });
    }
  });

  it("ignores multi-range requests", () => {
    expect(parseRange("bytes=0-9,20-29", TOTAL)).toEqual({ kind: "full", reason: "multi-range" });
    expect(parseRange("bytes=0-9, -5", TOTAL)).toEqual({ kind: "full", reason: "multi-range" });
  });
});

describe("mediaContentType", () => {
  it("maps media and HLS extensions", () => {
    expect(mediaContentType("/media/student-take-a.m4a")).toBe("audio/mp4");
    expect(mediaContentType("/media/test-pattern.mp4")).toBe("video/mp4");
    expect(mediaContentType("/media/test-pattern-hls/index.m3u8")).toBe(
      "application/vnd.apple.mpegurl",
    );
    expect(mediaContentType("/media/test-pattern-hls/segment-000.m4s")).toBe("video/iso.segment");
    expect(mediaContentType("/media/hls/segment-000.TS")).toBe("video/mp2t");
  });

  it("leaves other files to the assets handler", () => {
    expect(mediaContentType("/media/student-take-a.peaks.json")).toBeUndefined();
    expect(mediaContentType("/media/v1.0/readme")).toBeUndefined();
  });
});
