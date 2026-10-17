import type { RecordingUpload, SendFeedback } from "@singology/shared";

import type { PlayerComment } from "../player/types";

/** The server gives a sent comment its feedback. */
export type DraftComment = PlayerComment;

/** Page-local to the review form until the whole review is sent. */
export interface ReviewState {
  /** Sorted by time, so list numbers match the waveform markers. */
  comments: readonly DraftComment[];
  nextCommentNumber: number;
  /** Pinned at the time the draft was opened at. */
  draft: { tSeconds: number } | null;
  /** In library order. */
  assigned: readonly string[];
  summary: string;
}

export type ReviewEvent =
  | { type: "openDraft"; tSeconds: number }
  | { type: "cancelDraft" }
  | { type: "addComment"; body: string }
  | { type: "setAssigned"; libraryItemIds: readonly string[] }
  | { type: "setSummary"; summary: string };

export function initialReviewState(): ReviewState {
  return { comments: [], nextCommentNumber: 1, draft: null, assigned: [], summary: "" };
}

/** The review as the action reads it; ids and the draft stay on the page. */
export function toSendFeedback(review: ReviewState, reply: RecordingUpload | null): SendFeedback {
  return {
    intent: "send",
    summary: review.summary,
    comments: review.comments.map(({ tSeconds, body }) => ({ tSeconds, body })),
    reply,
    assignLibraryItemIds: [...review.assigned],
  };
}

export function reviewReducer(state: ReviewState, event: ReviewEvent): ReviewState {
  switch (event.type) {
    case "openDraft":
      return { ...state, draft: { tSeconds: Math.max(0, event.tSeconds) } };
    case "cancelDraft":
      return { ...state, draft: null };
    case "addComment": {
      const body = event.body.trim();
      if (state.draft === null || body === "") {
        return state;
      }
      const comment: DraftComment = {
        id: `draft-comment-${state.nextCommentNumber}`,
        tSeconds: state.draft.tSeconds,
        body,
      };
      return {
        ...state,
        // A stable sort keeps an earlier comment first when two share a time.
        comments: [...state.comments, comment].toSorted((a, b) => a.tSeconds - b.tSeconds),
        nextCommentNumber: state.nextCommentNumber + 1,
        draft: null,
      };
    }
    case "setAssigned":
      return { ...state, assigned: [...new Set(event.libraryItemIds)] };
    case "setSummary":
      return { ...state, summary: event.summary };
  }
}
