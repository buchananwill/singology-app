import { type FeedbackComment, type MediaAsset, WaveformPeaksSchema } from "@singology/shared";
import { type Dispatch, type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

import { formatTimestamp } from "../../lib/format";
import { attachMediaSource, type SourceMode } from "./attachMediaSource";
import type { LoopState, PlayerEvent } from "./playerReducer";

type Regions = InstanceType<typeof RegionsPlugin>;

const LOOP_REGION_ID = "loop";
const COMMENT_REGION_PREFIX = "comment-";

export interface WaveformColors {
  wave: string;
  progress: string;
  cursor: string;
  loop: string;
  comment: string;
  commentText: string;
}

export interface WaveformInstanceOptions {
  containerRef: RefObject<HTMLElement | null>;
  mediaRef: RefObject<HTMLMediaElement | null>;
  asset: Pick<MediaAsset, "src" | "hlsSrc" | "peaksSrc">;
  comments: readonly FeedbackComment[];
  loop: LoopState;
  dispatch: Dispatch<PlayerEvent>;
  height: number;
  /** Must keep its identity between renders: a new object rebuilds the waveform. */
  colors: WaveformColors;
}

export interface WaveformInstance {
  ready: boolean;
  error: string | null;
  sourceMode: SourceMode | null;
  clearLoop(): void;
}

function commentMarker(
  index: number,
  comment: FeedbackComment,
  colors: WaveformColors,
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
    borderRadius: "0.7em",
    background: colors.comment,
    color: colors.commentText,
    font: "600 11px/1.4em system-ui, sans-serif",
    textAlign: "center",
    cursor: "pointer",
  });
  return marker;
}

async function fetchPeaks(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Peaks request failed: ${response.status} ${url}`);
  }
  return WaveformPeaksSchema.parse(await response.json());
}

export function useWaveformInstance({
  containerRef,
  mediaRef,
  asset,
  comments,
  loop,
  dispatch,
  height,
  colors,
}: WaveformInstanceOptions): WaveformInstance {
  const { src, hlsSrc, peaksSrc } = asset;
  const regionsRef = useRef<Regions | null>(null);
  const loopRef = useRef(loop);
  // The `peaksSrc` whose waveform is drawn and whose source is attached; gates the comment markers.
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    const media = mediaRef.current;
    const container = containerRef.current;
    if (!media || !container) {
      return;
    }
    let disposed = false;
    const abort = new AbortController();
    let destroyWaveform: (() => void) | null = null;
    let detachSource: (() => void) | null = null;

    async function init(mediaEl: HTMLMediaElement, containerEl: HTMLElement) {
      const [{ default: WaveSurferClass }, { default: RegionsPluginClass }, peaks] =
        await Promise.all([
          import("wavesurfer.js"),
          import("wavesurfer.js/dist/plugins/regions.esm.js"),
          fetchPeaks(peaksSrc, abort.signal),
        ]);
      if (disposed) {
        return;
      }
      const regions = RegionsPluginClass.create();
      const wavesurfer = WaveSurferClass.create({
        container: containerEl,
        media: mediaEl,
        height,
        waveColor: colors.wave,
        progressColor: colors.progress,
        cursorColor: colors.cursor,
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 1,
        plugins: [regions],
      });
      destroyWaveform = () => wavesurfer.destroy();
      // An empty URL plus peaks and duration: wavesurfer draws the peaks without fetching or decoding.
      // It must finish before the source is attached, or its load would clear the element's `src`.
      await wavesurfer.load("", peaks.peaks, peaks.duration);
      if (disposed) {
        return;
      }

      regions.enableDragSelection({ id: LOOP_REGION_ID, color: colors.loop });
      regions.on("region-created", (region) => {
        if (region.id !== LOOP_REGION_ID) {
          return;
        }
        for (const other of regions.getRegions()) {
          if (other !== region && other.id === LOOP_REGION_ID) {
            other.remove();
          }
        }
        dispatch({
          type: "setLoop",
          region: { start: region.start, end: region.end },
          enabled: true,
        });
      });
      regions.on("region-updated", (region) => {
        if (region.id === LOOP_REGION_ID) {
          dispatch({ type: "setLoop", region: { start: region.start, end: region.end } });
        }
      });
      regions.on("region-clicked", (region, event) => {
        if (region.id.startsWith(COMMENT_REGION_PREFIX)) {
          // Stop the waveform's own click-to-seek; jump exactly to the comment.
          event.stopPropagation();
          mediaEl.currentTime = region.start;
        }
      });
      wavesurfer.on("timeupdate", (time) => {
        const current = loopRef.current;
        if (current.enabled && current.region && time >= current.region.end) {
          mediaEl.currentTime = current.region.start;
        }
      });
      regionsRef.current = regions;

      const attached = await attachMediaSource(mediaEl, { src, hlsSrc });
      if (disposed) {
        attached.detach();
        return;
      }
      detachSource = attached.detach;
      setSourceMode(attached.mode);
      setReadyFor(peaksSrc);
    }

    init(media, container).catch((err: unknown) => {
      if (!disposed) {
        setError(err instanceof Error ? err.message : "The player could not load.");
      }
    });

    return () => {
      disposed = true;
      abort.abort();
      regionsRef.current = null;
      destroyWaveform?.();
      detachSource?.();
    };
  }, [containerRef, mediaRef, dispatch, src, hlsSrc, peaksSrc, height, colors]);

  const ready = readyFor === peaksSrc;
  useEffect(() => {
    const regions = regionsRef.current;
    if (!ready || !regions) {
      return;
    }
    const created = comments.map((comment, index) =>
      regions.addRegion({
        id: `${COMMENT_REGION_PREFIX}${comment.id}`,
        start: comment.tSeconds,
        color: colors.comment,
        drag: false,
        resize: false,
        content: commentMarker(index, comment, colors),
      }),
    );
    return () => {
      for (const region of created) {
        region.remove();
      }
    };
  }, [ready, comments, colors]);

  const clearLoop = useCallback(() => {
    for (const region of regionsRef.current?.getRegions() ?? []) {
      if (region.id === LOOP_REGION_ID) {
        region.remove();
      }
    }
    dispatch({ type: "setLoop", region: null });
  }, [dispatch]);

  return { ready, error, sourceMode, clearLoop };
}
