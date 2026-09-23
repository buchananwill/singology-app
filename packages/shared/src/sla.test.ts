import { describe, expect, it } from "vitest";

import { DUE_SOON_HOURS, reviewSla } from "./sla";

const HOUR_MS = 60 * 60 * 1000;
const SUBMITTED = "2026-09-20T12:00:00.000Z";
const submittedMs = new Date(SUBMITTED).getTime();

describe("reviewSla", () => {
  it("is on track with more than the due-soon window left", () => {
    const sla = reviewSla(SUBMITTED, submittedMs + 26 * HOUR_MS);
    expect(sla).toEqual({
      dueAtMs: submittedMs + 72 * HOUR_MS,
      remainingMs: 46 * HOUR_MS,
      state: "on_track",
    });
  });

  it("is due soon inside the last hours before the deadline", () => {
    expect(reviewSla(SUBMITTED, submittedMs + (72 - DUE_SOON_HOURS) * HOUR_MS).state).toBe(
      "on_track",
    );
    expect(reviewSla(SUBMITTED, submittedMs + (72 - DUE_SOON_HOURS) * HOUR_MS + 1).state).toBe(
      "due_soon",
    );
    expect(reviewSla(SUBMITTED, submittedMs + 72 * HOUR_MS - 1).state).toBe("due_soon");
  });

  it("is overdue from the deadline on", () => {
    expect(reviewSla(SUBMITTED, submittedMs + 72 * HOUR_MS).state).toBe("overdue");
    expect(reviewSla(SUBMITTED, submittedMs + 80 * HOUR_MS).remainingMs).toBe(-8 * HOUR_MS);
  });

  it("takes the coach's own turnaround", () => {
    expect(reviewSla(SUBMITTED, submittedMs + 30 * HOUR_MS, 24).state).toBe("overdue");
  });
});
