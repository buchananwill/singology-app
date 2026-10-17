import type { ReviewMode, Submission, SubmissionStatus } from "./schemas";

export function reviewModeOf(submission: Pick<Submission, "status">): ReviewMode {
  return submission.status === "reviewed" ? "reviewed" : "reviewing";
}

/** A take in these states has no playable media yet. */
export type UnplayableStatus = Extract<SubmissionStatus, "processing" | "failed">;

const UNPLAYABLE_STATUSES: ReadonlySet<SubmissionStatus> = new Set<UnplayableStatus>([
  "processing",
  "failed",
]);

export function isUnplayableStatus(status: SubmissionStatus): status is UnplayableStatus {
  return UNPLAYABLE_STATUSES.has(status);
}
