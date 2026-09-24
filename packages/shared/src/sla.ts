import { HOUR_MS } from "./constants";

/** A queue item with less than this many hours left is "due soon". */
export const DUE_SOON_HOURS = 12;

export const REVIEW_SLA_STATES = ["on_track", "due_soon", "overdue"] as const;
export type ReviewSlaState = (typeof REVIEW_SLA_STATES)[number];

export interface ReviewSla {
  /** When the review is due: `submittedAt` plus the turnaround. */
  dueAtMs: number;
  /** Milliseconds left until `dueAtMs`; negative once overdue. */
  remainingMs: number;
  state: ReviewSlaState;
}

/**
 * Where a submission stands against the coach's turnaround promise at `nowMs`.
 * Pure, so the server and the browser compute the same result from the same inputs.
 */
export function reviewSla(submittedAt: string, nowMs: number, turnaroundHours: number): ReviewSla {
  const dueAtMs = new Date(submittedAt).getTime() + turnaroundHours * HOUR_MS;
  const remainingMs = dueAtMs - nowMs;
  const state: ReviewSlaState =
    remainingMs <= 0 ? "overdue" : remainingMs < DUE_SOON_HOURS * HOUR_MS ? "due_soon" : "on_track";
  return { dueAtMs, remainingMs, state };
}
