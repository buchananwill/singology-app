import { describe, expect, it } from "vitest";

import { DUE_SOON_HOURS, reviewSla } from "./sla";

const HOUR_MS = 60 * 60 * 1000;
const SUBMITTED = "2026-09-20T12:00:00.000Z";
const submittedMs = new Date(SUBMITTED).getTime();
const TURNAROUND_HOURS = 72;

describe("reviewSla", () => {
  it("is on track with more than the due-soon window left", () => {
    const sla = reviewSla(SUBMITTED, submittedMs + 26 * HOUR_MS, TURNAROUND_HOURS);
    expect(sla).toEqual({
      dueAtMs: submittedMs + TURNAROUND_HOURS * HOUR_MS,
      remainingMs: 46 * HOUR_MS,
      state: "on_track",
    });
  });

  it("is due soon inside the last hours before the deadline", () => {
    const at = (ms: number) => reviewSla(SUBMITTED, submittedMs + ms, TURNAROUND_HOURS).state;
    expect(at((TURNAROUND_HOURS - DUE_SOON_HOURS) * HOUR_MS)).toBe("on_track");
    expect(at((TURNAROUND_HOURS - DUE_SOON_HOURS) * HOUR_MS + 1)).toBe("due_soon");
    expect(at(TURNAROUND_HOURS * HOUR_MS - 1)).toBe("due_soon");
  });

  it("is overdue from the deadline on", () => {
    expect(
      reviewSla(SUBMITTED, submittedMs + TURNAROUND_HOURS * HOUR_MS, TURNAROUND_HOURS).state,
    ).toBe("overdue");
    expect(reviewSla(SUBMITTED, submittedMs + 80 * HOUR_MS, TURNAROUND_HOURS).remainingMs).toBe(
      -8 * HOUR_MS,
    );
  });

  it("takes the coach's own turnaround", () => {
    expect(reviewSla(SUBMITTED, submittedMs + 30 * HOUR_MS, 24).state).toBe("overdue");
  });
});
