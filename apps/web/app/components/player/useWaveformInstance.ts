import type { FeedbackComment, MediaAsset } from "@singology/shared";
import { type Dispatch, type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

import { attachMediaSource, type SourceMode } from "./attachMediaSource";
import type { LoopState, PlayerEvent } from "./playerReducer";
import { commentMarker, fetchPeaks } from "./waveformDom";
import type { WaveformTheme } from "./waveformTheme";

type Regions = InstanceType<typeof RegionsPlugin>;

const LOOP_REGION_ID = "loop";
const COMMENT_REGION_PREFIX = "comment-";

export interface WaveformInstanceOptions {
  containerRef: RefObject<HTMLElement | null>;
  mediaRef: RefObject<HTMLMediaElement | null>;
  asset: Pick<MediaAsset, "src" | "hlsSrc" | "peaksSrc">;
  comments: readonly FeedbackComment[];
  loop: LoopState;
  dispatch: Dispatch<PlayerEvent>;
  height: number;
  /** Must keep its identity between renders: a new object rebuilds the waveform. */
  theme: WaveformTheme;
}

export interface WaveformInstance {
  ready: boolean;
  error: string | null;
  sourceMode: SourceMode | null;
  clearLoop(): void;
}

export function useWaveformInstance({
  containerRef,
  mediaRef,
  asset,
  comments,
  loop,
  dispatch,
  height,
  theme,
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
        waveColor: theme.wave,
        progressColor: theme.progress,
        cursorColor: theme.cursor,
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

      regions.enableDragSelection({ id: LOOP_REGION_ID, color: theme.loop });
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
  }, [containerRef, mediaRef, dispatch, src, hlsSrc, peaksSrc, height, theme]);

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
        color: theme.comment,
        drag: false,
        resize: false,
        content: commentMarker(index, comment, theme),
      }),
    );
    return () => {
      for (const region of created) {
        region.remove();
      }
    };
  }, [ready, comments, theme]);

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
