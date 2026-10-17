import { WaveformPeaksSchema } from "@singology/shared";

import { formatTimestamp } from "../../lib/format";
import type { PlayerComment } from "./types";
import type { WaveformTheme } from "./waveformTheme";

export function commentMarker(
  index: number,
  comment: PlayerComment,
  theme: WaveformTheme,
): HTMLElement {
  const marker = document.createElement("span");
  marker.textContent = String(index + 1);
  marker.title = comment.body;
  marker.setAttribute("role", "button");
  marker.setAttribute("aria-label", `Comment ${index + 1} at ${formatTimestamp(comment.tSeconds)}`);
  marker.dataset.testid = "comment-marker";
  marker.dataset.commentId = comment.id;
  Object.assign(marker.style, {
    display: "inline-block",
    minWidth: "1.4em",
    padding: "0 0.3em",
    textAlign: "center",
    cursor: "pointer",
    ...theme.commentMarker,
  });
  return marker;
}

export async function fetchPeaks(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Peaks request failed: ${response.status} ${url}`);
  }
  return WaveformPeaksSchema.parse(await response.json());
}
