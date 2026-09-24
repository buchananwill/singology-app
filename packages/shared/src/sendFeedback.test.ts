import { describe, expect, it } from "vitest";

import { SendFeedbackSchema, sendFeedbackSchemaFor } from "./schemas";

const reply = {
  fileName: "reply.m4a",
  sizeBytes: 12345,
  durationSec: 27.8,
  mimeType: "audio/mp4",
};

describe("SendFeedbackSchema", () => {
  it("accepts comments, a summary, a reply and exercises to assign", () => {
    const parsed = SendFeedbackSchema.parse({
      summary: "  Good work.  ",
      comments: [{ tSeconds: 30, body: " Keep the ribs wide. " }],
      reply,
      assignLibraryItemIds: ["lib-breath-hiss"],
    });
    expect(parsed.summary).toBe("Good work.");
    expect(parsed.comments).toEqual([{ tSeconds: 30, body: "Keep the ribs wide." }]);
    expect(parsed.reply).toEqual({ ...reply, note: "" });
  });

  it("accepts comments alone, with no reply and nothing assigned", () => {
    const parsed = SendFeedbackSchema.safeParse({
      comments: [{ tSeconds: 0, body: "Nice start." }],
      reply: null,
      assignLibraryItemIds: [],
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.summary).toBe("");
  });

  it("rejects feedback with nothing in it", () => {
    const parsed = SendFeedbackSchema.safeParse({
      summary: "   ",
      comments: [],
      reply: null,
      assignLibraryItemIds: ["lib-breath-hiss"],
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe(
      "Add a comment, a summary or a reply before sending.",
    );
  });

  it("rejects empty or negative-time comments", () => {
    const base = { reply: null, assignLibraryItemIds: [] };
    expect(
      SendFeedbackSchema.safeParse({ ...base, comments: [{ tSeconds: 3, body: "  " }] }).success,
    ).toBe(false);
    expect(
      SendFeedbackSchema.safeParse({ ...base, comments: [{ tSeconds: -1, body: "Hi" }] }).success,
    ).toBe(false);
  });

  it("rejects a reply that is not audio or video, and duplicate exercises", () => {
    const comments = [{ tSeconds: 1, body: "Hi" }];
    expect(
      SendFeedbackSchema.safeParse({
        comments,
        reply: { ...reply, mimeType: "image/png" },
        assignLibraryItemIds: [],
      }).success,
    ).toBe(false);
    expect(
      SendFeedbackSchema.safeParse({
        comments,
        reply: null,
        assignLibraryItemIds: ["lib-a", "lib-a"],
      }).success,
    ).toBe(false);
  });
});

describe("sendFeedbackSchemaFor", () => {
  const schema = sendFeedbackSchemaFor({
    durationSec: 76.6,
    libraryItemIds: new Set(["lib-a", "lib-b"]),
  });
  const firstMessage = (input: unknown) => schema.safeParse(input).error?.issues[0]?.message;

  it("accepts a payload inside the take and the library", () => {
    expect(
      schema.parse({
        summary: "",
        comments: [{ tSeconds: 30, body: "Steady here." }],
        reply: null,
        assignLibraryItemIds: ["lib-b"],
      }),
    ).toEqual({
      summary: "",
      comments: [{ tSeconds: 30, body: "Steady here." }],
      reply: null,
      assignLibraryItemIds: ["lib-b"],
    });
  });

  it("reports the shape's problems first", () => {
    expect(firstMessage({ comments: [], reply: null, assignLibraryItemIds: [] })).toBe(
      "Add a comment, a summary or a reply before sending.",
    );
    expect(schema.safeParse("not json").success).toBe(false);
  });

  it("rejects comments past the end of the take", () => {
    expect(
      firstMessage({
        comments: [{ tSeconds: 80, body: "Late" }],
        reply: null,
        assignLibraryItemIds: [],
      }),
    ).toBe("A comment is past the end of the take.");
  });

  it("rejects exercises that are not in the library", () => {
    expect(
      firstMessage({
        comments: [{ tSeconds: 1, body: "Hi" }],
        reply: null,
        assignLibraryItemIds: ["lib-x"],
      }),
    ).toBe("An assigned exercise is not in the library.");
  });

  it("leaves SendFeedbackSchema without the limits", () => {
    expect(
      SendFeedbackSchema.safeParse({
        comments: [{ tSeconds: 80, body: "Late" }],
        reply: null,
        assignLibraryItemIds: ["lib-x"],
      }).success,
    ).toBe(true);
  });
});
