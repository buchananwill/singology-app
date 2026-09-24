import { RecordingUploadSchema } from "@singology/shared";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseInput } from "./actionResult";

function form(values: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(values)) {
    formData.set(name, value);
  }
  return formData;
}

const FALLBACK = "The upload details were not valid.";

function parseUpload(values: Record<string, string>) {
  return parseInput(RecordingUploadSchema, Object.fromEntries(form(values)), FALLBACK);
}

const VALID = {
  fileName: "take.m4a",
  sizeBytes: "611219",
  durationSec: "76.6",
  mimeType: "audio/mp4",
  note: "Second go",
};

describe("parseInput", () => {
  it("returns the parsed data", () => {
    expect(parseUpload(VALID)).toEqual({
      ok: true,
      data: { ...VALID, sizeBytes: 611219, durationSec: 76.6 },
    });
    expect(parseUpload({ ...VALID, mimeType: "video/quicktime" }).ok).toBe(true);
  });

  it("applies the schema's defaults", () => {
    const withoutNote = form(VALID);
    withoutNote.delete("note");
    const result = parseInput(RecordingUploadSchema, Object.fromEntries(withoutNote), FALLBACK);
    expect(result.ok && result.data.note).toBe("");
  });

  it("reports the schema's first problem", () => {
    expect(parseUpload({ ...VALID, mimeType: "image/png" })).toEqual({
      ok: false,
      error: "Pick an audio or video file.",
    });
    expect(parseUpload({ ...VALID, fileName: "" }).ok).toBe(false);
    expect(parseUpload({ ...VALID, durationSec: "Infinity" }).ok).toBe(false);
    expect(parseUpload({ ...VALID, sizeBytes: "-1" }).ok).toBe(false);
  });

  it("parses any input, not only forms", () => {
    const Schema = z.object({ count: z.number().int() });
    expect(parseInput(Schema, { count: 2 }, FALLBACK)).toEqual({ ok: true, data: { count: 2 } });
    expect(parseInput(Schema, null, FALLBACK).ok).toBe(false);
  });
});
