import type { RecordingUpload } from "@singology/shared";
import { type Dispatch, useMemo, useReducer } from "react";
import { useFetcher } from "react-router";

import { useActionNotification } from "../../lib/useActionNotification";
import {
  isFeedbackSent,
  isReplyAttached,
  type ReviewActionResult,
  type ReviewFetcherKeys,
  reviewFetcherKeys,
} from "./reviewFetchers";
import {
  initialReviewState,
  type ReviewEvent,
  reviewReducer,
  type ReviewState,
  toSendFeedback,
} from "./reviewReducer";

export type SendState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent"; message: string; feedbackId: string }
  | { status: "failed"; error: string };

export interface ReviewSession {
  review: ReviewState;
  dispatch: Dispatch<ReviewEvent>;
  reply: RecordingUpload | null;
  sendState: SendState;
  /** Once true nothing on the page stays editable. */
  sent: boolean;
  send(): void;
  keys: ReviewFetcherKeys;
}

function sendStateOf(busy: boolean, result: ReviewActionResult | undefined): SendState {
  if (busy) {
    return { status: "sending" };
  }
  if (isFeedbackSent(result)) {
    return { status: "sent", message: result.message, feedbackId: result.feedbackId };
  }
  return result?.ok === false ? { status: "failed", error: result.error } : { status: "idle" };
}

export function useReviewSession(submissionId: string): ReviewSession {
  const [review, dispatch] = useReducer(reviewReducer, undefined, initialReviewState);
  const keys = useMemo(() => reviewFetcherKeys(submissionId), [submissionId]);
  const replied = useFetcher<ReviewActionResult>({ key: keys.reply }).data;
  const sendFetcher = useFetcher<ReviewActionResult>({ key: keys.send });
  const sendResult = useActionNotification(sendFetcher, "Feedback sent");
  const reply = isReplyAttached(replied) ? replied.upload : null;
  const sendState = sendStateOf(sendFetcher.state !== "idle", sendResult);
  return {
    review,
    dispatch,
    reply,
    sendState,
    sent: sendState.status === "sent",
    send: () => {
      void sendFetcher.submit(toSendFeedback(review, reply), {
        method: "post",
        encType: "application/json",
      });
    },
    keys,
  };
}
