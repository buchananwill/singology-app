import type { RecordingUpload } from "@singology/shared";

/**
 * What a route action returns to the upload panel. `upload` echoes the
 * validated metadata, for pages that read the result through a keyed fetcher
 * (e.g. the coach's reply, which is sent later with the feedback).
 */
export type UploadActionResult =
  { ok: true; message: string; upload?: RecordingUpload } | { ok: false; error: string };
