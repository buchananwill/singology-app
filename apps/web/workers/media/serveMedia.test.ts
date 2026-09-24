import { HLS_MIME_TYPE } from "@singology/shared";
import { describe, expect, it } from "vitest";

import { type AssetFetcher, serveMedia } from "./serveMedia";

const BYTES = new Uint8Array(Array.from({ length: 200 }, (_, i) => i));

/** A stand-in for the ASSETS binding that serves BYTES for every path, or 404 for `/missing`. */
const assets: AssetFetcher = {
  fetch: async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname.endsWith("/missing.m4a")) {
      return new Response("not found", { status: 404 });
    }
    return new Response(BYTES, {
      headers: { "Content-Type": "application/octet-stream", ETag: '"v1"' },
    });
  },
};

function get(path: string, headers: Record<string, string> = {}, method = "GET"): Request {
  return new Request(`http://localhost${path}`, { method, headers });
}

describe("serveMedia", () => {
  it("serves the whole asset with 200 and Accept-Ranges when there is no Range", async () => {
    const response = await serveMedia(get("/media/a.m4a"), assets);
    expect(response.status).toBe(200);
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");
    expect(response.headers.get("Content-Type")).toBe("audio/mp4");
    expect(response.headers.get("Content-Length")).toBe("200");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(BYTES);
  });

  it("answers a single range with 206 and the sliced body", async () => {
    const response = await serveMedia(get("/media/a.m4a", { Range: "bytes=10-19" }), assets);
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe("bytes 10-19/200");
    expect(response.headers.get("Content-Length")).toBe("10");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(BYTES.slice(10, 20));
  });

  it("answers a suffix range with the tail", async () => {
    const response = await serveMedia(get("/media/a.m4a", { Range: "bytes=-5" }), assets);
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe("bytes 195-199/200");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(BYTES.slice(195));
  });

  it("answers an unsatisfiable range with 416", async () => {
    const response = await serveMedia(get("/media/a.m4a", { Range: "bytes=500-" }), assets);
    expect(response.status).toBe(416);
    expect(response.headers.get("Content-Range")).toBe("bytes */200");
  });

  it("ignores multi-range and serves the whole asset", async () => {
    const response = await serveMedia(get("/media/a.m4a", { Range: "bytes=0-1,5-6" }), assets);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Length")).toBe("200");
  });

  it("serves HEAD with headers and no body", async () => {
    const response = await serveMedia(get("/media/a.m4a", { Range: "bytes=0-99" }, "HEAD"), assets);
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Length")).toBe("100");
    expect(response.body).toBeNull();
  });

  it("ignores Range when If-Range no longer matches", async () => {
    const response = await serveMedia(
      get("/media/a.m4a", { Range: "bytes=0-9", "If-Range": '"old"' }),
      assets,
    );
    expect(response.status).toBe(200);
  });

  it("types HLS playlists and segments", async () => {
    const playlist = await serveMedia(get("/media/hls/index.m3u8"), assets);
    expect(playlist.headers.get("Content-Type")).toBe(HLS_MIME_TYPE);
    const segment = await serveMedia(get("/media/hls/segment-000.m4s"), assets);
    expect(segment.headers.get("Content-Type")).toBe("video/iso.segment");
  });

  it("passes non-200 asset answers through and rejects other methods", async () => {
    expect((await serveMedia(get("/media/missing.m4a"), assets)).status).toBe(404);
    const post = await serveMedia(get("/media/a.m4a", {}, "POST"), assets);
    expect(post.status).toBe(405);
    expect(post.headers.get("Allow")).toBe("GET, HEAD");
  });
});
