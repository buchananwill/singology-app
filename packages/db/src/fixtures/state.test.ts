import type { Submission } from "@singology/shared";
import { describe, expect, it } from "vitest";

import { assignmentStatusFrom } from "./state";

const take = (assignmentId: string | undefined, status: Submission["status"]): Submission => ({
  id: crypto.randomUUID(),
  enrolmentId: "enrol",
  assignmentId,
  libraryItemId: "item",
  mediaId: "media",
  note: "",
  submittedAt: "2026-10-16T09:00:00.000Z",
  status,
});

describe("assignmentStatusFrom", () => {
  it("is todo when no submission references the assignment", () => {
    expect(
      assignmentStatusFrom([take("other", "reviewed"), take(undefined, "reviewed")], "a"),
    ).toBe("todo");
  });

  it("is submitted when a submission references it and none is reviewed", () => {
    expect(assignmentStatusFrom([take("a", "processing"), take("a", "awaiting_review")], "a")).toBe(
      "submitted",
    );
    expect(assignmentStatusFrom([take("a", "failed")], "a")).toBe("submitted");
  });

  it("is feedback_ready when a reviewed submission references it", () => {
    expect(assignmentStatusFrom([take("a", "awaiting_review"), take("a", "reviewed")], "a")).toBe(
      "feedback_ready",
    );
  });
});
