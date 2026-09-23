import type { FeedbackComment } from "@singology/shared";
import { describe, expect, it } from "vitest";

import { initialReviewState, reviewReducer } from "./reviewReducer";

const seeded: FeedbackComment[] = [
  { id: "c2", feedbackId: "fb", tSeconds: 40, body: "Later" },
  { id: "c1", feedbackId: "fb", tSeconds: 10, body: "Earlier" },
];

describe("reviewReducer", () => {
  it("seeds the comments sorted by time", () => {
    const state = initialReviewState("fb", seeded);
    expect(state.comments.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(state.draft).toBeNull();
  });

  it("adds a comment at the time the draft was opened, in time order", () => {
    let state = initialReviewState("fb", seeded);
    state = reviewReducer(state, { type: "openDraft", tSeconds: 21.4 });
    expect(state.draft).toEqual({ tSeconds: 21.4 });
    state = reviewReducer(state, { type: "addComment", body: "  Breath runs out here.  " });
    expect(state.draft).toBeNull();
    expect(state.comments.map((c) => [c.tSeconds, c.body])).toEqual([
      [10, "Earlier"],
      [21.4, "Breath runs out here."],
      [40, "Later"],
    ]);
    expect(state.comments[1]).toMatchObject({ id: "draft-comment-1", feedbackId: "fb" });
  });

  it("gives each new comment its own id", () => {
    let state = initialReviewState("fb", []);
    for (const t of [5, 5]) {
      state = reviewReducer(state, { type: "openDraft", tSeconds: t });
      state = reviewReducer(state, { type: "addComment", body: "Same time" });
    }
    expect(state.comments.map((c) => c.id)).toEqual(["draft-comment-1", "draft-comment-2"]);
  });

  it("ignores an empty comment and an add with no open draft", () => {
    const opened = reviewReducer(initialReviewState("fb", []), { type: "openDraft", tSeconds: 3 });
    expect(reviewReducer(opened, { type: "addComment", body: "   " })).toBe(opened);
    const closed = reviewReducer(opened, { type: "cancelDraft" });
    expect(closed.draft).toBeNull();
    expect(reviewReducer(closed, { type: "addComment", body: "Hi" })).toBe(closed);
  });

  it("clamps a negative time to zero", () => {
    const state = reviewReducer(initialReviewState("fb", []), { type: "openDraft", tSeconds: -1 });
    expect(state.draft).toEqual({ tSeconds: 0 });
  });
});
