import type { FeedbackComment } from "@singology/shared";

/** The server gives a sent comment its feedback. */
export type DraftComment = Omit<FeedbackComment, "feedbackId">;

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

export function initialReviewState(comments: readonly DraftComment[] = []): ReviewState {
  return {
    comments: comments.toSorted((a, b) => a.tSeconds - b.tSeconds),
    nextCommentNumber: 1,
    draft: null,
    assigned: [],
    summary: "",
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
