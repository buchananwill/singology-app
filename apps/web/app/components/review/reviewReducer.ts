import type { FeedbackComment } from "@singology/shared";

/**
 * The coach's draft review, page-local to the review workspace (no global
 * store). Seeded from the loader; nothing persists (decision 11).
 */
export interface ReviewState {
  /** The feedback id new comments belong to (the existing feedback, or a draft id). */
  feedbackId: string;
  /** Every comment, sorted by time, so list numbers match the waveform markers. */
  comments: readonly FeedbackComment[];
  /** Counter for page-local comment ids. */
  nextCommentNumber: number;
  /** The comment being written, pinned at the time it was opened at; `null` when none. */
  draft: { tSeconds: number } | null;
  /** Library item ids ticked in "Assign next exercises", in library order. */
  assigned: readonly string[];
}

export type ReviewEvent =
  | { type: "openDraft"; tSeconds: number }
  | { type: "cancelDraft" }
  | { type: "addComment"; body: string }
  | { type: "setAssigned"; libraryItemIds: readonly string[] };

export function initialReviewState(
  feedbackId: string,
  comments: readonly FeedbackComment[],
): ReviewState {
  return {
    feedbackId,
    comments: [...comments].sort((a, b) => a.tSeconds - b.tSeconds),
    nextCommentNumber: 1,
    draft: null,
    assigned: [],
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
        comments: [...state.comments, comment].sort((a, b) => a.tSeconds - b.tSeconds),
        nextCommentNumber: state.nextCommentNumber + 1,
        draft: null,
      };
    }
    case "setAssigned":
      return { ...state, assigned: [...new Set(event.libraryItemIds)] };
  }
}
