import { type RecordingUpload, RecordingUploadSchema } from "@singology/shared";

export type ParsedRecordingUpload =
  | { ok: true; upload: RecordingUpload }
  | { ok: false; error: string };

/** Validates the upload panel's posted metadata in a route action. */
export function parseRecordingUpload(formData: FormData): ParsedRecordingUpload {
  const parsed = RecordingUploadSchema.safeParse({
    fileName: formData.get("fileName"),
    sizeBytes: formData.get("sizeBytes"),
    durationSec: formData.get("durationSec"),
    mimeType: formData.get("mimeType"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) {
    const [issue] = parsed.error.issues;
    return { ok: false, error: issue?.message ?? "The upload details were not valid." };
  }
  return { ok: true, upload: parsed.data };
}
