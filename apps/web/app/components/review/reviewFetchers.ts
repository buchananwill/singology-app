import type { Feedback, RecordingUpload } from "@singology/shared";

import type { ActionResult } from "../../lib/actionResult";

export interface MessagePayload {
  message: string;
}

export interface ReplyAttached extends MessagePayload {
  upload: RecordingUpload;
}

export interface FeedbackSent extends MessagePayload {
  feedbackId: Feedback["id"];
}

export type ReviewActionResult = ActionResult<ReplyAttached> | ActionResult<FeedbackSent>;

function isOkMessage(result: unknown): result is { ok: true; message: string } {
  return (
    typeof result === "object" &&
    result !== null &&
    "ok" in result &&
    result.ok === true &&
    "message" in result &&
    typeof result.message === "string"
  );
}

export function isFeedbackSent(
  result: unknown,
): result is Extract<ReviewActionResult, { feedbackId: string }> {
  return isOkMessage(result) && "feedbackId" in result && typeof result.feedbackId === "string";
}

export function isReplyAttached(
  result: unknown,
): result is Extract<ReviewActionResult, { upload: RecordingUpload }> {
  return (
    isOkMessage(result) &&
    "upload" in result &&
    typeof result.upload === "object" &&
    result.upload !== null
  );
}

export interface ReviewFetcherKeys {
  reply: string;
  send: string;
}

/** One pair per submission, so a page never reads another take's results. */
export function reviewFetcherKeys(submissionId: string): ReviewFetcherKeys {
  return { reply: `coach-reply-${submissionId}`, send: `coach-send-${submissionId}` };
}
