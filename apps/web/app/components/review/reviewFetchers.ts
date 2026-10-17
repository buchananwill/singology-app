import type { Feedback, RecordingUpload } from "@singology/shared";

import type { ActionResult } from "../../lib/actionResult";

export interface ReplyAttached {
  message: string;
  upload: RecordingUpload;
}

export interface FeedbackSent {
  message: string;
  feedbackId: Feedback["id"];
}

export type ReviewActionResult = ActionResult<ReplyAttached> | ActionResult<FeedbackSent>;

export function isFeedbackSent(result: unknown): result is { ok: true } & FeedbackSent {
  return (
    typeof result === "object" &&
    result !== null &&
    "ok" in result &&
    result.ok === true &&
    "feedbackId" in result &&
    typeof result.feedbackId === "string"
  );
}

export function isReplyAttached(result: unknown): result is { ok: true } & ReplyAttached {
  return (
    typeof result === "object" &&
    result !== null &&
    "ok" in result &&
    result.ok === true &&
    "upload" in result
  );
}

export function replyFetcherKey(submissionId: string): string {
  return `coach-reply-${submissionId}`;
}

export function sendFetcherKey(submissionId: string): string {
  return `coach-send-${submissionId}`;
}
