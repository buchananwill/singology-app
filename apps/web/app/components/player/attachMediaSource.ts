import { HLS_MIME_TYPE, type MediaAsset } from "@singology/shared";

/** How the media element got its source (spec decision 21). */
export type SourceMode = "progressive" | "native-hls" | "hls.js";

export interface AttachedSource {
  mode: SourceMode;
  /** Stops loading and releases the source (and any hls.js instance). Safe to call more than once. */
  detach(): void;
}

function resetElement(media: HTMLMediaElement): void {
  media.pause();
  media.removeAttribute("src");
  media.load();
}

function once(fn: () => void): () => void {
  let done = false;
  return () => {
    if (!done) {
      done = true;
      fn();
    }
  };
}

/**
 * Gives `media` its source. When the asset has an HLS rendition and the
 * element is a `<video>`: native HLS if the browser can play it (Safari,
 * iOS), else hls.js over Media Source Extensions, imported on demand so it
 * never loads during SSR or for audio. Otherwise the progressive `src`.
 * Browser-only: call it from an effect, never during render.
 */
export async function attachMediaSource(
  media: HTMLMediaElement,
  asset: Pick<MediaAsset, "src" | "hlsSrc">,
): Promise<AttachedSource> {
  const { hlsSrc } = asset;
  if (hlsSrc !== undefined && media instanceof HTMLVideoElement) {
    if (media.canPlayType(HLS_MIME_TYPE)) {
      media.src = hlsSrc;
      return { mode: "native-hls", detach: once(() => resetElement(media)) };
    }
    const { default: Hls } = await import("hls.js");
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(hlsSrc);
      hls.attachMedia(media);
      return {
        mode: "hls.js",
        detach: once(() => {
          hls.destroy();
          resetElement(media);
        }),
      };
    }
  }
  media.src = asset.src;
  return { mode: "progressive", detach: once(() => resetElement(media)) };
}
