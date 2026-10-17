import { type FeedbackComment, WaveformPeaksSchema } from "@singology/shared";

import { formatTimestamp } from "../../lib/format";
import type { WaveformTheme } from "./waveformTheme";

/** A sent comment or a coach's unsent draft: the player needs only its time and text. */
export type PlayerComment = Pick<FeedbackComment, "id" | "tSeconds" | "body">;

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
