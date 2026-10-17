import type { RecordingUpload } from "@singology/shared";
import { describe, expect, it } from "vitest";

import {
  type ReviewEvent,
  initialReviewState,
  reviewReducer,
  type ReviewState,
  toSendFeedback,
} from "./reviewReducer";

function after(...events: ReviewEvent[]): ReviewState {
  return events.reduce(reviewReducer, initialReviewState());
}

function commentAt(tSeconds: number, body: string): ReviewEvent[] {
  return [
    { type: "openDraft", tSeconds },
    { type: "addComment", body },
  ];
}

describe("reviewReducer", () => {
  it("starts empty", () => {
    expect(initialReviewState()).toEqual({
      comments: [],
      nextCommentNumber: 1,
      draft: null,
      assigned: [],
      summary: "",
    });
  });

  it("adds a comment at the time the draft was opened, in time order", () => {
    let state = after(...commentAt(40, "Later"), ...commentAt(10, "Earlier"));
    state = reviewReducer(state, { type: "openDraft", tSeconds: 21.4 });
    expect(state.draft).toEqual({ tSeconds: 21.4 });
    state = reviewReducer(state, { type: "addComment", body: "  Breath runs out here.  " });
    expect(state.draft).toBeNull();
    expect(state.comments.map((c) => [c.tSeconds, c.body])).toEqual([
      [10, "Earlier"],
      [21.4, "Breath runs out here."],
      [40, "Later"],
    ]);
    expect(state.comments[1]).toEqual({
      id: "draft-comment-3",
      tSeconds: 21.4,
      body: "Breath runs out here.",
    });
  });

  it("gives each new comment its own id", () => {
    const state = after(...commentAt(5, "Same time"), ...commentAt(5, "Same time"));
    expect(state.comments.map((c) => c.id)).toEqual(["draft-comment-1", "draft-comment-2"]);
  });

  it("ignores an empty comment and an add with no open draft", () => {
    const opened = after({ type: "openDraft", tSeconds: 3 });
    expect(reviewReducer(opened, { type: "addComment", body: "   " })).toBe(opened);
    const closed = reviewReducer(opened, { type: "cancelDraft" });
    expect(closed.draft).toBeNull();
    expect(reviewReducer(closed, { type: "addComment", body: "Hi" })).toBe(closed);
  });

  it("holds the ticked exercises, without duplicates", () => {
    const state = after({ type: "setAssigned", libraryItemIds: ["lib-a", "lib-b", "lib-a"] });
    expect(state.assigned).toEqual(["lib-a", "lib-b"]);
  });

  it("edits the summary", () => {
    expect(after({ type: "setSummary", summary: "New" }).summary).toBe("New");
  });

  it("clamps a negative time to zero", () => {
    expect(after({ type: "openDraft", tSeconds: -1 }).draft).toEqual({ tSeconds: 0 });
  });
});

describe("toSendFeedback", () => {
  it("sends the comments' times and text, the summary, the reply and the ticked exercises", () => {
    const reply: RecordingUpload = {
      fileName: "reply.m4a",
      sizeBytes: 12345,
      durationSec: 27.8,
      mimeType: "audio/mp4",
      note: "",
    };
    const state = after(
      ...commentAt(12, "Better."),
      ...commentAt(3, "Good start."),
      { type: "setSummary", summary: "Cleaner onsets." },
      { type: "setAssigned", libraryItemIds: ["lib-a"] },
      { type: "openDraft", tSeconds: 20 },
    );
    expect(toSendFeedback(state, reply)).toEqual({
      intent: "send",
      summary: "Cleaner onsets.",
      comments: [
        { tSeconds: 3, body: "Good start." },
        { tSeconds: 12, body: "Better." },
      ],
      reply,
      assignLibraryItemIds: ["lib-a"],
    });
    expect(toSendFeedback(initialReviewState(), null).reply).toBeNull();
  });
});
