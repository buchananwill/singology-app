import type { RecordingUpload } from "@singology/shared";

import type { MessageResult } from "../../lib/actionResult";

/** A reply upload echoes its metadata back; a sent review returns the feedback's id. */
export type ReviewActionResult = MessageResult & { upload?: RecordingUpload; feedbackId?: string };

/** The fetcher key the reply's upload panel shares with the page, one per submission. */
export function replyFetcherKey(submissionId: string): string {
  return `coach-reply-${submissionId}`;
}

/** The fetcher key the send card shares with the page, one per submission. */
export function sendFetcherKey(submissionId: string): string {
  return `coach-send-${submissionId}`;
}
