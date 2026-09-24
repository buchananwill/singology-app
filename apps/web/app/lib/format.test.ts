import { describe, expect, it } from "vitest";

import {
  formatBytes,
  formatDate,
  formatDuration,
  formatElapsed,
  formatPence,
  formatTimeLeft,
} from "./format";

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

  it("formats time since an event", () => {
    const minute = 60 * 1000;
    expect(formatElapsed(20 * 1000, 72)).toBe("just now");
    expect(formatElapsed(12 * minute, 72)).toBe("12 min ago");
    expect(formatElapsed(60 * minute, 72)).toBe("1 hour ago");
    expect(formatElapsed(62 * 60 * minute, 72)).toBe("62 hours ago");
    expect(formatElapsed(12.5 * 24 * 60 * minute, 72)).toBe("12 days ago");
  });

  it("switches from hours to days at the given threshold", () => {
    const hour = 60 * 60 * 1000;
    expect(formatElapsed(47 * hour, 48)).toBe("47 hours ago");
    expect(formatElapsed(48 * hour, 48)).toBe("2 days ago");
    expect(formatElapsed(71 * hour, 72)).toBe("71 hours ago");
    expect(formatElapsed(72 * hour, 72)).toBe("3 days ago");
  });

  it("formats time left before a deadline", () => {
    const minute = 60 * 1000;
    expect(formatTimeLeft((46 * 60 + 5) * minute + 30 * 1000)).toBe("46h 05m left");
    expect(formatTimeLeft(9 * minute + 59 * 1000)).toBe("9m left");
    expect(formatTimeLeft(0)).toBe("overdue");
    expect(formatTimeLeft(-5 * minute)).toBe("overdue");
  });

  it("formats byte counts", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(611219)).toBe("596.9 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
