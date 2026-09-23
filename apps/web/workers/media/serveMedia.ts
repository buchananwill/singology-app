import { mediaContentType, parseRange } from "./range";

/** The part of the `ASSETS` binding this route uses. */
export type AssetFetcher = Pick<Fetcher, "fetch">;

/** Paths this route owns. Must match `assets.run_worker_first` in wrangler.jsonc. */
export const MEDIA_PATH_PREFIX = "/media/";

/**
 * Serves a `/media/*` static asset with HTTP Range support (spec decision 31, pitfall 6).
 *
 * The Workers static-assets handler ignores `Range`, so Chromium cannot seek into media it has not
 * fully buffered. This reads the asset through the `ASSETS` binding and answers:
 * - no usable `Range` (absent, malformed or multi-range): `200` with the whole body;
 * - one satisfiable byte range: `206` with `Content-Range`;
 * - an unsatisfiable range: `416` with `Content-Range: bytes *\/total`.
 * Every answer carries `Accept-Ranges: bytes`. `HEAD` returns the same headers with no body.
 *
 * FACADE ONLY: the whole asset is buffered in memory before slicing. That is fine for the small
 * generated fixtures and wrong for real media, which the slice serves from Bunny's CDN (D21, D31).
 */
export async function serveMedia(request: Request, assets: AssetFetcher): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  // Ask for the plain asset: no Range or conditional headers, so the answer is the full body.
  const asset = await assets.fetch(new Request(request.url, { method: "GET" }));
  if (asset.status !== 200) {
    return asset;
  }
  const body = await asset.arrayBuffer();
  const total = body.byteLength;

  const headers = new Headers(asset.headers);
  headers.delete("Content-Encoding");
  headers.set("Accept-Ranges", "bytes");
  const type = mediaContentType(new URL(request.url).pathname);
  if (type) {
    headers.set("Content-Type", type);
  }

  // If-Range: serve a range only while the client's validator still matches this asset.
  const ifRange = request.headers.get("If-Range");
  const etag = asset.headers.get("ETag");
  const rangeHeader = ifRange !== null && ifRange !== etag ? null : request.headers.get("Range");
  const range = parseRange(rangeHeader, total);
  const isHead = request.method === "HEAD";

  if (range.kind === "unsatisfiable") {
    headers.set("Content-Range", `bytes */${total}`);
    headers.set("Content-Length", "0");
    return new Response(null, { status: 416, headers });
  }
  if (range.kind === "full") {
    headers.set("Content-Length", String(total));
    return new Response(isHead ? null : body, { status: 200, headers });
  }
  const length = range.end - range.start + 1;
  headers.set("Content-Range", `bytes ${range.start}-${range.end}/${total}`);
  headers.set("Content-Length", String(length));
  return new Response(isHead ? null : body.slice(range.start, range.end + 1), {
    status: 206,
    headers,
  });
}
