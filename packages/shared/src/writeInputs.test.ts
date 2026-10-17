import { describe, expect, it } from "vitest";

import { RecordEventSchema, RegisterMediaSchema, SendFeedbackInputSchema } from "./schemas";

describe("SendFeedbackInputSchema", () => {
  it("adds the submission and the registered reply to the review", () => {
    const parsed = SendFeedbackInputSchema.parse({
      intent: "send",
      summary: "Good.",
      comments: [],
      reply: null,
      assignLibraryItemIds: [],
      submissionId: "sub-1",
      replyMediaId: "media-1",
    });
    expect(parsed.submissionId).toBe("sub-1");
    expect(parsed.replyMediaId).toBe("media-1");
  });

  it("keeps the review's rule that something must be sent", () => {
    const parsed = SendFeedbackInputSchema.safeParse({
      intent: "send",
      comments: [],
      reply: null,
      assignLibraryItemIds: [],
      submissionId: "sub-1",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("RegisterMediaSchema", () => {
  it("accepts an audio upload and rejects a non-media mime type", () => {
    const upload = {
      kind: "audio",
      store: "bunny_storage",
      storeKey: "takes/abc.m4a",
      originalFileName: "take.m4a",
      sizeBytes: 1024,
      mimeType: "audio/mp4",
    };
    expect(RegisterMediaSchema.safeParse(upload).success).toBe(true);
    expect(RegisterMediaSchema.safeParse({ ...upload, mimeType: "text/plain" }).success).toBe(
      false,
    );
  });
});

describe("RecordEventSchema", () => {
  it("accepts each kind with its own meta and rejects an unknown kind", () => {
    expect(RecordEventSchema.safeParse({ kind: "signed_in" }).success).toBe(true);
    expect(
      RecordEventSchema.safeParse({
        kind: "feedback_viewed",
        entityId: "s",
        meta: { feedbackId: "f" },
      }).success,
    ).toBe(true);
    expect(
      RecordEventSchema.safeParse({
        kind: "feedback_sent",
        entityId: "f",
        meta: { submissionId: "s", commentCount: 2, assignedCount: 0 },
      }).success,
    ).toBe(true);
    expect(RecordEventSchema.safeParse({ kind: "page_viewed" }).success).toBe(false);
  });

  it("rejects a meta that belongs to another kind", () => {
    expect(
      RecordEventSchema.safeParse({
        kind: "feedback_sent",
        entityId: "f",
        meta: { feedbackId: "f" },
      }).success,
    ).toBe(false);
    expect(
      RecordEventSchema.safeParse({ kind: "feedback_viewed", meta: { feedbackId: "f" } }).success,
    ).toBe(false);
  });
});
