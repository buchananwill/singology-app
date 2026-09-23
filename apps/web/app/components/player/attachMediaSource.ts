import type { MediaAsset } from "@singology/shared";

/** How the media element got its source. */
export type SourceMode = "progressive";

export interface AttachedSource {
  mode: SourceMode;
  /** Stops loading and releases the source. Safe to call more than once. */
  detach(): void;
}

function resetElement(media: HTMLMediaElement): void {
  media.pause();
  media.removeAttribute("src");
  media.load();
}

/**
 * Gives `media` its source. Browser-only: call it from an effect, never
 * during render, so SSR never touches the media APIs.
 */
export async function attachMediaSource(
  media: HTMLMediaElement,
  asset: Pick<MediaAsset, "src" | "hlsSrc">,
): Promise<AttachedSource> {
  media.src = asset.src;
  let detached = false;
  return {
    mode: "progressive",
    detach: () => {
      if (!detached) {
        detached = true;
        resetElement(media);
      }
    },
  };
}
