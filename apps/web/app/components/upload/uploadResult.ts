/** What a route action returns to the upload panel. */
export type UploadActionResult = { ok: true; message: string } | { ok: false; error: string };
