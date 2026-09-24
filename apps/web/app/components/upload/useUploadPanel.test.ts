import { RecordingUploadSchema } from "@singology/shared";
import { describe, expect, it } from "vitest";

import { buildUploadPayload } from "./useUploadPanel";

const FILE = { name: "take.m4a", size: 611219, type: "audio/mp4" };

describe("buildUploadPayload", () => {
  it("posts the file's metadata and the note", () => {
    expect(buildUploadPayload(FILE, 76.6, "Second go")).toEqual({
      fileName: "take.m4a",
      sizeBytes: 611219,
      durationSec: 76.6,
      mimeType: "audio/mp4",
      note: "Second go",
    });
  });

  it("adds the page's extra fields", () => {
    expect(buildUploadPayload(FILE, 76.6, "", { intent: "reply" })).toMatchObject({
      intent: "reply",
      fileName: "take.m4a",
    });
  });

  it("builds what the upload schema accepts", () => {
    expect(RecordingUploadSchema.safeParse(buildUploadPayload(FILE, 76.6, "")).success).toBe(true);
  });
});
