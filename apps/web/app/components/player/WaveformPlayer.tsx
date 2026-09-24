import { Box, Button, Group, SegmentedControl, Stack, Switch, Text } from "@mantine/core";
import { type FeedbackComment, type MediaAsset, WaveformPeaksSchema } from "@singology/shared";
import {
  type Ref,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type WaveSurfer from "wavesurfer.js";
import type RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

import { attachMediaSource, type SourceMode } from "./attachMediaSource";
import { type PlayerHandle, usePlayer } from "./PlayerProvider";
import { PLAYBACK_RATES, type PlaybackRate, shouldReportMediaTime } from "./playerReducer";

type Regions = InstanceType<typeof RegionsPlugin>;

const LOOP_REGION_ID = "loop";
const COMMENT_REGION_PREFIX = "comment-";
const NO_COMMENTS: readonly FeedbackComment[] = [];

const COLORS = {
  wave: "#a5b4c8",
  progress: "#1c7ed6",
  cursor: "#0b3d91",
  loop: "rgba(28, 126, 214, 0.18)",
  comment: "#e8590c",
} as const;

export interface WaveformPlayerProps {
  asset: MediaAsset;
  /** Coach comments to pin on the waveform; clicking one seeks to it. */
  comments?: readonly FeedbackComment[];
  /** Accessible name for the player, e.g. "Student take". */
  label: string;
  /** Waveform height in pixels. */
  height?: number;
  /** Receives the same handle as `usePlayer().handle`. */
  ref?: Ref<PlayerHandle>;
}

function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

function toPlaybackRate(value: string): PlaybackRate | undefined {
  return PLAYBACK_RATES.find((rate) => String(rate) === value);
}

function commentMarker(index: number, comment: FeedbackComment): HTMLElement {
  const marker = document.createElement("span");
  marker.textContent = String(index + 1);
  marker.title = comment.body;
  marker.setAttribute("role", "button");
  marker.setAttribute("aria-label", `Comment ${index + 1} at ${formatTime(comment.tSeconds)}`);
  marker.dataset.testid = "comment-marker";
  marker.dataset.commentId = comment.id;
  Object.assign(marker.style, {
    display: "inline-block",
    minWidth: "1.4em",
    padding: "0 0.3em",
    borderRadius: "0.7em",
    background: COLORS.comment,
    color: "#fff",
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

/**
 * Waveform player (spec decisions 20, 21): our own `<audio>`/`<video>`
 * element, wavesurfer.js 8 attached to it with pre-computed peaks (the file
 * is never decoded), rate buttons, a drag-to-create loop region and comment
 * markers. Must be rendered inside a `PlayerProvider`.
 */
export function WaveformPlayer({
  asset,
  comments = NO_COMMENTS,
  label,
  height = 96,
  ref,
}: WaveformPlayerProps) {
  const { state, dispatch, handle, mediaRef } = usePlayer();
  useImperativeHandle(ref, () => handle, [handle]);

  const { kind, src, hlsSrc, peaksSrc, durationSec } = asset;
  const waveformRef = useRef<HTMLDivElement>(null);
  const regionsRef = useRef<Regions | null>(null);
  const loopRef = useRef(state.loop);
  const lastTimeReportRef = useRef<number | null>(null);
  /** The `peaksSrc` whose waveform is drawn and whose source is attached; gates the comment effect. */
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loopRef.current = state.loop;
  }, [state.loop]);

  // Create wavesurfer (browser only), draw the pre-computed peaks, then attach the media source.
  useEffect(() => {
    const media = mediaRef.current;
    const container = waveformRef.current;
    if (!media || !container) {
      return;
    }
    let disposed = false;
    const abort = new AbortController();
    let wavesurfer: WaveSurfer | null = null;
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
      wavesurfer = WaveSurferClass.create({
        container: containerEl,
        media: mediaEl,
        height,
        waveColor: COLORS.wave,
        progressColor: COLORS.progress,
        cursorColor: COLORS.cursor,
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 1,
        plugins: [regions],
      });
      // An empty URL plus peaks and duration: wavesurfer draws the peaks without fetching or decoding.
      // It must finish before the source is attached, or its load would clear the element's `src`.
      await wavesurfer.load("", peaks.peaks, peaks.duration);
      if (disposed) {
        return;
      }

      regions.enableDragSelection({ id: LOOP_REGION_ID, color: COLORS.loop });
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
        const loop = loopRef.current;
        if (loop.enabled && loop.region && time >= loop.region.end) {
          mediaEl.currentTime = loop.region.start;
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
      wavesurfer?.destroy();
      detachSource?.();
    };
  }, [mediaRef, dispatch, src, hlsSrc, peaksSrc, height]);

  // Comment markers, redrawn when the comments change.
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
        color: COLORS.comment,
        drag: false,
        resize: false,
        content: commentMarker(index, comment),
      }),
    );
    return () => {
      for (const region of created) {
        region.remove();
      }
    };
  }, [ready, comments]);

  // Rate: applied to the media element with pitch preserved (defaultPlaybackRate survives a source reload).
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) {
      return;
    }
    media.preservesPitch = true;
    media.defaultPlaybackRate = state.rate;
    media.playbackRate = state.rate;
  }, [mediaRef, state.rate]);

  const clearLoop = useCallback(() => {
    for (const region of regionsRef.current?.getRegions() ?? []) {
      if (region.id === LOOP_REGION_ID) {
        region.remove();
      }
    }
    dispatch({ type: "setLoop", region: null });
  }, [dispatch]);

  const onTimeUpdate = useCallback(
    (event: SyntheticEvent<HTMLMediaElement>) => {
      const now = performance.now();
      if (shouldReportMediaTime(lastTimeReportRef.current, now)) {
        lastTimeReportRef.current = now;
        dispatch({ type: "mediaTime", time: event.currentTarget.currentTime });
      }
    },
    [dispatch],
  );

  const mediaProps = {
    preload: "metadata",
    onPlay: () => dispatch({ type: "play" }),
    onPause: () => dispatch({ type: "pause" }),
    onSeeked: (event: SyntheticEvent<HTMLMediaElement>) =>
      dispatch({ type: "seek", time: event.currentTarget.currentTime }),
    onTimeUpdate,
    "data-testid": "player-media",
    "data-source-mode": sourceMode ?? undefined,
  } as const;

  return (
    <Stack gap="xs" role="group" aria-label={label} data-testid="waveform-player">
      {kind === "video" ? (
        <Box
          component="video"
          ref={mediaRef as Ref<HTMLVideoElement>}
          playsInline
          w="100%"
          bg="black"
          style={{ aspectRatio: "16 / 9", display: "block" }}
          {...mediaProps}
        />
      ) : (
        <audio ref={mediaRef as Ref<HTMLAudioElement>} {...mediaProps} />
      )}
      <Box
        ref={waveformRef}
        data-testid="waveform"
        data-ready={ready ? "true" : "false"}
        mih={height}
        style={{ cursor: "text" }}
      />
      {error !== null && (
        <Text c="red" size="sm" role="alert">
          {error}
        </Text>
      )}
      <Group gap="sm" wrap="wrap">
        <Button
          size="xs"
          onClick={() => (state.isPlaying ? handle.pause() : void handle.play())}
          aria-label={state.isPlaying ? "Pause" : "Play"}
        >
          {state.isPlaying ? "Pause" : "Play"}
        </Button>
        <Text size="sm" ff="monospace" data-testid="player-time">
          {formatTime(state.currentTime)} / {formatTime(durationSec)}
        </Text>
        <SegmentedControl
          size="xs"
          aria-label="Playback speed"
          value={String(state.rate)}
          onChange={(value) => {
            const rate = toPlaybackRate(value);
            if (rate !== undefined) {
              dispatch({ type: "setRate", rate });
            }
          }}
          data={PLAYBACK_RATES.map((rate) => ({ value: String(rate), label: `${rate}x` }))}
        />
        <Switch
          size="sm"
          label="Loop"
          checked={state.loop.enabled}
          disabled={state.loop.region === null}
          onChange={(event) => dispatch({ type: "setLoop", enabled: event.currentTarget.checked })}
        />
        <Button
          size="xs"
          variant="subtle"
          onClick={clearLoop}
          disabled={state.loop.region === null}
        >
          Clear loop
        </Button>
      </Group>
      <Text size="xs" c="dimmed">
        Drag across the waveform to mark a loop.
      </Text>
    </Stack>
  );
}
