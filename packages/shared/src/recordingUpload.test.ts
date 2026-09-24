import { describe, expect, it } from "vitest";

import { RecordingUploadSchema } from "./schemas";

const VALID = {
  fileName: "take.m4a",
  sizeBytes: "611219",
  durationSec: "76.6",
  mimeType: "audio/mp4",
  note: "Second go",
};

describe("RecordingUploadSchema", () => {
  it("coerces the numeric fields", () => {
    expect(RecordingUploadSchema.parse(VALID)).toEqual({
      ...VALID,
      sizeBytes: 611219,
      durationSec: 76.6,
    });
  });

  it("accepts audio and video files", () => {
    expect(RecordingUploadSchema.safeParse({ ...VALID, mimeType: "video/quicktime" }).success).toBe(
      true,
    );
  });

  it("defaults the note to empty", () => {
    expect(RecordingUploadSchema.parse({ ...VALID, note: undefined }).note).toBe("");
  });

  it("rejects anything but audio or video", () => {
    const parsed = RecordingUploadSchema.safeParse({ ...VALID, mimeType: "image/png" });
    expect(parsed.error?.issues[0]?.message).toBe("Pick an audio or video file.");
  });

  it("rejects an empty name, an infinite duration and a negative size", () => {
    expect(RecordingUploadSchema.safeParse({ ...VALID, fileName: "" }).success).toBe(false);
    expect(RecordingUploadSchema.safeParse({ ...VALID, durationSec: "Infinity" }).success).toBe(
      false,
    );
    expect(RecordingUploadSchema.safeParse({ ...VALID, sizeBytes: "-1" }).success).toBe(false);
  });
});
