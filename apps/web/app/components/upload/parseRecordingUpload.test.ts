import { describe, expect, it } from "vitest";

import { parseRecordingUpload } from "./parseRecordingUpload";

function form(values: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(values)) {
    formData.set(name, value);
  }
  return formData;
}

const VALID = {
  fileName: "take.m4a",
  sizeBytes: "611219",
  durationSec: "76.6",
  mimeType: "audio/mp4",
  note: "Second go",
};

describe("parseRecordingUpload", () => {
  it("accepts audio or video metadata and coerces numbers", () => {
    expect(parseRecordingUpload(form(VALID))).toEqual({
      ok: true,
      upload: { ...VALID, sizeBytes: 611219, durationSec: 76.6 },
    });
    expect(parseRecordingUpload(form({ ...VALID, mimeType: "video/quicktime" })).ok).toBe(true);
  });

  it("defaults a missing note to empty", () => {
    const withoutNote = form(VALID);
    withoutNote.delete("note");
    const result = parseRecordingUpload(withoutNote);
    expect(result.ok && result.upload.note).toBe("");
  });

  it("rejects other file types, missing names and bad numbers", () => {
    expect(parseRecordingUpload(form({ ...VALID, mimeType: "image/png" }))).toEqual({
      ok: false,
      error: "Pick an audio or video file.",
    });
    expect(parseRecordingUpload(form({ ...VALID, fileName: "" })).ok).toBe(false);
    expect(parseRecordingUpload(form({ ...VALID, durationSec: "Infinity" })).ok).toBe(false);
    expect(parseRecordingUpload(form({ ...VALID, sizeBytes: "-1" })).ok).toBe(false);
  });
});
