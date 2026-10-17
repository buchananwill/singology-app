import { describe, expect, it } from "vitest";

import { isoDate, isoWeekStart, startOfIsoDate } from "./dates";

describe("isoDate and startOfIsoDate", () => {
  it("round-trip a UTC calendar date", () => {
    expect(isoDate(new Date("2026-10-17T23:59:59Z"))).toBe("2026-10-17");
    expect(startOfIsoDate("2026-10-12").toISOString()).toBe("2026-10-12T00:00:00.000Z");
  });
});

describe("isoWeekStart", () => {
  it("is the Monday of the UTC week, including on the Monday and the Sunday", () => {
    expect(isoWeekStart(new Date("2026-10-12T00:00:00Z"))).toBe("2026-10-12");
    expect(isoWeekStart(new Date("2026-10-15T09:00:00Z"))).toBe("2026-10-12");
    expect(isoWeekStart(new Date("2026-10-18T23:59:59Z"))).toBe("2026-10-12");
    expect(isoWeekStart(new Date("2026-11-01T12:00:00Z"))).toBe("2026-10-26");
  });
});
