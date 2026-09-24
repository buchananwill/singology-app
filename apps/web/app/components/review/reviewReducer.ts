import type { FeedbackComment } from "@singology/shared";

/** Page-local to the review workspace, seeded from the loader; nothing persists. */
export interface ReviewState {
  /** The existing feedback's id, or a draft id. */
  feedbackId: string;
  /** Sorted by time, so list numbers match the waveform markers. */
  comments: readonly FeedbackComment[];
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

export function initialReviewState(
  feedbackId: string,
  comments: readonly FeedbackComment[],
  summary = "",
): ReviewState {
  return {
    feedbackId,
    comments: comments.toSorted((a, b) => a.tSeconds - b.tSeconds),
    nextCommentNumber: 1,
    draft: null,
    assigned: [],
    summary,
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
      const comment: FeedbackComment = {
        id: `draft-comment-${state.nextCommentNumber}`,
        feedbackId: state.feedbackId,
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
