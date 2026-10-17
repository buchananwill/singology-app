import type { RecordingUpload } from "@singology/shared";
import { type Dispatch, useMemo, useReducer } from "react";
import { useFetcher } from "react-router";

import {
  isFeedbackSent,
  isReplyAttached,
  replyFetcherKey,
  type ReviewActionResult,
  sendFetcherKey,
} from "./reviewFetchers";
import {
  initialReviewState,
  type ReviewEvent,
  reviewReducer,
  type ReviewState,
} from "./reviewReducer";

export interface ReviewSession {
  review: ReviewState;
  dispatch: Dispatch<ReviewEvent>;
  reply: RecordingUpload | null;
  sent: boolean;
  keys: { reply: string; send: string };
}

/** The page-local review and the two keyed fetchers its panels post through. */
export function useReviewSession(submissionId: string): ReviewSession {
  const [review, dispatch] = useReducer(reviewReducer, [], initialReviewState);
  const keys = useMemo(
    () => ({ reply: replyFetcherKey(submissionId), send: sendFetcherKey(submissionId) }),
    [submissionId],
  );
  const replied = useFetcher<ReviewActionResult>({ key: keys.reply }).data;
  const sent = useFetcher<ReviewActionResult>({ key: keys.send }).data;
  return {
    review,
    dispatch,
    reply: isReplyAttached(replied) ? replied.upload : null,
    sent: isFeedbackSent(sent),
    keys,
  };
}
