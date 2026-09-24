// Only a single byte range is honoured: RFC 9110 lets a server ignore any other `Range`.
import { HLS_MIME_TYPE } from "@singology/shared";

export type FullBodyReason = "absent" | "malformed" | "multi-range";

export type RangeResult =
  | { readonly kind: "full"; readonly reason: FullBodyReason }
  /** Inclusive byte offsets, already clamped to the representation. */
  | { readonly kind: "partial"; readonly start: number; readonly end: number }
  | { readonly kind: "unsatisfiable" };

const DIGITS = /^\d+$/;

function parseOffset(text: string): number | undefined {
  if (!DIGITS.test(text)) {
    return undefined;
  }
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : undefined;
}

/** A syntactically valid range that selects no byte is unsatisfiable (`416`). */
export function parseRange(header: string | null, total: number): RangeResult {
  if (header === null || header.trim() === "") {
    return { kind: "full", reason: "absent" };
  }
  const match = /^\s*([A-Za-z]+)\s*=\s*(.*?)\s*$/.exec(header);
  if (!match || match[1]?.toLowerCase() !== "bytes") {
    return { kind: "full", reason: "malformed" };
  }
  const spec = match[2] ?? "";
  if (spec.includes(",")) {
    return { kind: "full", reason: "multi-range" };
  }
  const dash = spec.indexOf("-");
  if (dash === -1) {
    return { kind: "full", reason: "malformed" };
  }
  const firstText = spec.slice(0, dash).trim();
  const lastText = spec.slice(dash + 1).trim();

  if (firstText === "") {
    // Suffix range: the last N bytes.
    const length = parseOffset(lastText);
    if (length === undefined) {
      return { kind: "full", reason: "malformed" };
    }
    if (length === 0 || total === 0) {
      return { kind: "unsatisfiable" };
    }
    return { kind: "partial", start: Math.max(0, total - length), end: total - 1 };
  }

  const start = parseOffset(firstText);
  if (start === undefined) {
    return { kind: "full", reason: "malformed" };
  }
  let end = total - 1;
  if (lastText !== "") {
    const last = parseOffset(lastText);
    if (last === undefined || last < start) {
      return { kind: "full", reason: "malformed" };
    }
    end = Math.min(last, total - 1);
  }
  if (start >= total) {
    return { kind: "unsatisfiable" };
  }
  return { kind: "partial", start, end };
}

const MEDIA_TYPES: Readonly<Record<string, string>> = {
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".m4s": "video/iso.segment",
  ".ts": "video/mp2t",
  ".m3u8": HLS_MIME_TYPE,
};

/** The `Content-Type` for a media path by extension, or `undefined` to keep the asset's own. */
export function mediaContentType(pathname: string): string | undefined {
  const dot = pathname.lastIndexOf(".");
  if (dot === -1 || dot < pathname.lastIndexOf("/")) {
    return undefined;
  }
  return MEDIA_TYPES[pathname.slice(dot).toLowerCase()];
}
