import { describe, expect, it } from "vitest";

import { reviewActionSchemaFor, SendFeedbackSchema, sendFeedbackSchemaFor } from "./schemas";

const reply = {
  fileName: "reply.m4a",
  sizeBytes: 12345,
  durationSec: 27.8,
  mimeType: "audio/mp4",
};

/** A "Send feedback" payload with the given fields. */
function send(fields: Record<string, unknown>) {
  return { intent: "send", ...fields };
}

describe("SendFeedbackSchema", () => {
  it("accepts comments, a summary, a reply and exercises to assign", () => {
    const parsed = SendFeedbackSchema.parse(
      send({
        summary: "  Good work.  ",
        comments: [{ tSeconds: 30, body: " Keep the ribs wide. " }],
        reply,
        assignLibraryItemIds: ["lib-breath-hiss"],
      }),
    );
    expect(parsed.summary).toBe("Good work.");
    expect(parsed.comments).toEqual([{ tSeconds: 30, body: "Keep the ribs wide." }]);
    expect(parsed.reply).toEqual({ ...reply, note: "" });
  });

  it("accepts comments alone, with no reply and nothing assigned", () => {
    const parsed = SendFeedbackSchema.safeParse(
      send({
        comments: [{ tSeconds: 0, body: "Nice start." }],
        reply: null,
        assignLibraryItemIds: [],
      }),
    );
    expect(parsed.success).toBe(true);
    expect(parsed.data?.summary).toBe("");
  });

  it("rejects feedback with nothing in it", () => {
    const parsed = SendFeedbackSchema.safeParse(
      send({
        summary: "   ",
        comments: [],
        reply: null,
        assignLibraryItemIds: ["lib-breath-hiss"],
      }),
    );
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe(
      "Add a comment, a summary or a reply before sending.",
    );
  });

  it("rejects empty or negative-time comments", () => {
    const base = { reply: null, assignLibraryItemIds: [] };
    expect(
      SendFeedbackSchema.safeParse(send({ ...base, comments: [{ tSeconds: 3, body: "  " }] }))
        .success,
    ).toBe(false);
    expect(
      SendFeedbackSchema.safeParse(send({ ...base, comments: [{ tSeconds: -1, body: "Hi" }] }))
        .success,
    ).toBe(false);
  });

  it("rejects a reply that is not audio or video, and duplicate exercises", () => {
    const comments = [{ tSeconds: 1, body: "Hi" }];
    expect(
      SendFeedbackSchema.safeParse(
        send({ comments, reply: { ...reply, mimeType: "image/png" }, assignLibraryItemIds: [] }),
      ).success,
    ).toBe(false);
    expect(
      SendFeedbackSchema.safeParse(
        send({ comments, reply: null, assignLibraryItemIds: ["lib-a", "lib-a"] }),
      ).success,
    ).toBe(false);
  });
});

const limits = { durationSec: 76.6, libraryItemIds: new Set(["lib-a", "lib-b"]) };

describe("sendFeedbackSchemaFor", () => {
  const schema = sendFeedbackSchemaFor(limits);
  const firstMessage = (input: unknown) => schema.safeParse(input).error?.issues[0]?.message;

  it("accepts a payload inside the take and the library", () => {
    const payload = send({
      summary: "",
      comments: [{ tSeconds: 30, body: "Steady here." }],
      reply: null,
      assignLibraryItemIds: ["lib-b"],
    });
    expect(schema.parse(payload)).toEqual(payload);
  });

  it("reports the shape's problems first", () => {
    expect(firstMessage(send({ comments: [], reply: null, assignLibraryItemIds: [] }))).toBe(
      "Add a comment, a summary or a reply before sending.",
    );
    expect(schema.safeParse("not json").success).toBe(false);
  });

  it("rejects comments past the end of the take", () => {
    expect(
      firstMessage(
        send({ comments: [{ tSeconds: 80, body: "Late" }], reply: null, assignLibraryItemIds: [] }),
      ),
    ).toBe("A comment is past the end of the take.");
  });

  it("rejects exercises that are not in the library", () => {
    expect(
      firstMessage(
        send({
          comments: [{ tSeconds: 1, body: "Hi" }],
          reply: null,
          assignLibraryItemIds: ["lib-x"],
        }),
      ),
    ).toBe("An assigned exercise is not in the library.");
  });

  it("leaves SendFeedbackSchema without the limits", () => {
    expect(
      SendFeedbackSchema.safeParse(
        send({
          comments: [{ tSeconds: 80, body: "Late" }],
          reply: null,
          assignLibraryItemIds: ["lib-x"],
        }),
      ).success,
    ).toBe(true);
  });
});

describe("reviewActionSchemaFor", () => {
  const schema = reviewActionSchemaFor(limits);

  it("parses a reply upload", () => {
    expect(schema.parse({ intent: "reply", ...reply, sizeBytes: "12345" })).toEqual({
      intent: "reply",
      ...reply,
      note: "",
    });
  });

  it("parses feedback with its limits", () => {
    const payload = send({
      comments: [{ tSeconds: 1, body: "Hi" }],
      reply: null,
      assignLibraryItemIds: [],
    });
    expect(schema.parse(payload)).toEqual({ ...payload, summary: "" });
    expect(
      schema.safeParse(
        send({ comments: [{ tSeconds: 80, body: "Late" }], reply: null, assignLibraryItemIds: [] }),
      ).error?.issues[0]?.message,
    ).toBe("A comment is past the end of the take.");
  });

  it("rejects anything without a known intent", () => {
    expect(schema.safeParse({ ...reply }).success).toBe(false);
    expect(schema.safeParse({ intent: "delete" }).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });
});
