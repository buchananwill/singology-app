import { HOUR_MS, MINUTE_MS } from "@singology/shared";
import { describe, expect, it } from "vitest";

import {
  formatBytes,
  formatDate,
  formatDuration,
  formatElapsed,
  formatPence,
  formatTimeLeft,
  formatTurnaround,
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
    expect(formatElapsed(20 * 1000, 72)).toBe("just now");
    expect(formatElapsed(12 * MINUTE_MS, 72)).toBe("12 min ago");
    expect(formatElapsed(60 * MINUTE_MS, 72)).toBe("1 hour ago");
    expect(formatElapsed(62 * HOUR_MS, 72)).toBe("62 hours ago");
    expect(formatElapsed(12.5 * 24 * HOUR_MS, 72)).toBe("12 days ago");
  });

  it("switches from hours to days at the given threshold", () => {
    expect(formatElapsed(47 * HOUR_MS, 48)).toBe("47 hours ago");
    expect(formatElapsed(48 * HOUR_MS, 48)).toBe("2 days ago");
    expect(formatElapsed(71 * HOUR_MS, 72)).toBe("71 hours ago");
    expect(formatElapsed(72 * HOUR_MS, 72)).toBe("3 days ago");
  });

  it("formats a turnaround in days when it is whole days, else in hours", () => {
    expect(formatTurnaround(72)).toBe("3 days");
    expect(formatTurnaround(24)).toBe("1 day");
    expect(formatTurnaround(36)).toBe("36 hours");
    expect(formatTurnaround(1)).toBe("1 hour");
  });

  it("formats time left before a deadline", () => {
    expect(formatTimeLeft(46 * HOUR_MS + 5 * MINUTE_MS + 30 * 1000)).toBe("46h 05m left");
    expect(formatTimeLeft(9 * MINUTE_MS + 59 * 1000)).toBe("9m left");
    expect(formatTimeLeft(0)).toBe("overdue");
    expect(formatTimeLeft(-5 * MINUTE_MS)).toBe("overdue");
  });

  it("formats byte counts", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(611219)).toBe("596.9 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
