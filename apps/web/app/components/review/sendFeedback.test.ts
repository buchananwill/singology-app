import { describe, expect, it } from "vitest";

import { parseSendFeedback } from "./sendFeedback";

const limits = { durationSec: 76.6, libraryItemIds: new Set(["lib-a", "lib-b"]) };

describe("parseSendFeedback", () => {
  it("accepts a valid payload", () => {
    const result = parseSendFeedback(
      {
        summary: "",
        comments: [{ tSeconds: 30, body: "Steady here." }],
        reply: null,
        assignLibraryItemIds: ["lib-b"],
      },
      limits,
    );
    expect(result).toEqual({
      ok: true,
      feedback: {
        summary: "",
        comments: [{ tSeconds: 30, body: "Steady here." }],
        reply: null,
        assignLibraryItemIds: ["lib-b"],
      },
    });
  });

  it("reports the schema's first problem", () => {
    expect(
      parseSendFeedback({ comments: [], reply: null, assignLibraryItemIds: [] }, limits),
    ).toEqual({
      ok: false,
      error: "Add a comment, a summary or a reply before sending.",
    });
    expect(parseSendFeedback("not json", limits).ok).toBe(false);
  });

  it("rejects comments past the end of the take", () => {
    const result = parseSendFeedback(
      { comments: [{ tSeconds: 80, body: "Late" }], reply: null, assignLibraryItemIds: [] },
      limits,
    );
    expect(result).toEqual({ ok: false, error: "A comment is past the end of the take." });
  });

  it("rejects exercises that are not in the library", () => {
    const result = parseSendFeedback(
      { comments: [{ tSeconds: 1, body: "Hi" }], reply: null, assignLibraryItemIds: ["lib-x"] },
      limits,
    );
    expect(result).toEqual({ ok: false, error: "An assigned exercise is not in the library." });
  });
});
