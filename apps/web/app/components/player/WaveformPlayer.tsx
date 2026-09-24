import { Box, Stack, Text } from "@mantine/core";
import type { FeedbackComment, MediaAsset } from "@singology/shared";
import {
  type Ref,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { PlayerControls } from "./PlayerControls";
import { type PlayerHandle, usePlayer } from "./PlayerProvider";
import { shouldReportMediaTime } from "./playerReducer";
import { useWaveformInstance, type WaveformColors } from "./useWaveformInstance";

const NO_COMMENTS: readonly FeedbackComment[] = [];

const COLORS: WaveformColors = {
  wave: "#a5b4c8",
  progress: "#1c7ed6",
  cursor: "#0b3d91",
  loop: "rgba(28, 126, 214, 0.18)",
  comment: "#e8590c",
  commentText: "#fff",
};

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

/** Must be rendered inside a `PlayerProvider`. */
export function WaveformPlayer({
  asset,
  comments = NO_COMMENTS,
  label,
  height = 96,
  ref,
}: WaveformPlayerProps) {
  const { state, dispatch, handle, mediaRef } = usePlayer();
  useImperativeHandle(ref, () => handle, [handle]);

  const { kind, durationSec } = asset;
  const waveformRef = useRef<HTMLDivElement>(null);
  const lastTimeReportRef = useRef<number | null>(null);
  const { ready, error, sourceMode, clearLoop } = useWaveformInstance({
    containerRef: waveformRef,
    mediaRef,
    asset,
    comments,
    loop: state.loop,
    dispatch,
    height,
    colors: COLORS,
  });

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
      <PlayerControls durationSec={durationSec} onClearLoop={clearLoop} />
      <Text size="xs" c="dimmed">
        Drag across the waveform to mark a loop.
      </Text>
    </Stack>
  );
}
