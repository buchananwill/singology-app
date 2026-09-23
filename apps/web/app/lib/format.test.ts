import { describe, expect, it } from "vitest";

import { formatBytes, formatDate, formatDuration, formatPence } from "./format";

describe("format", () => {
  it("formats pence as pounds", () => {
    expect(formatPence(8000)).toBe("£80");
    expect(formatPence(1200)).toBe("£12");
    expect(formatPence(4550)).toBe("£45.50");
    expect(formatPence(5)).toBe("£0.05");
  });

  it("formats ISO dates in UTC, independent of ICU data", () => {
    expect(formatDate("2026-09-08T19:30:00.000Z")).toBe("8 Sep 2026");
    expect(formatDate("2026-09-30T23:30:00.000Z")).toBe("30 Sep 2026");
  });

  it("formats durations as m:ss", () => {
    expect(formatDuration(76.6)).toBe("1:17");
    expect(formatDuration(5)).toBe("0:05");
  });

  it("formats byte counts", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(611219)).toBe("596.9 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
