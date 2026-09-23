/** Playback rates offered by the player (spec decision 20). */
export const PLAYBACK_RATES = [0.5, 0.75, 1] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

/**
 * Minimum wall-clock gap between `mediaTime` events: at most 4 React
 * updates a second from playback (spec decision 20). The waveform cursor is
 * drawn by wavesurfer itself, so this only drives the time readout.
 */
export const MEDIA_TIME_INTERVAL_MS = 250;

export interface LoopRegion {
  start: number;
  end: number;
}

export interface LoopState {
  enabled: boolean;
  /** The drag-created loop region; `null` until the user drags one. */
  region: LoopRegion | null;
}

export interface PlayerState {
  isPlaying: boolean;
  /** Media position in seconds, updated at most every `MEDIA_TIME_INTERVAL_MS` during playback. */
  currentTime: number;
  rate: PlaybackRate;
  loop: LoopState;
}

export type PlayerEvent =
  /** The media element started playing. */
  | { type: "play" }
  /** The media element paused (or ended). */
  | { type: "pause" }
  /** The media element finished seeking to `time`. */
  | { type: "seek"; time: number }
  /** The user picked a playback rate; the player applies it to the media element. */
  | { type: "setRate"; rate: PlaybackRate }
  /**
   * Update the loop: `region` replaces (or with `null` clears) the loop region,
   * `enabled` switches looping on or off. Looping cannot be on without a region.
   */
  | { type: "setLoop"; enabled?: boolean; region?: LoopRegion | null }
  /** A throttled playback position report from the media element. */
  | { type: "mediaTime"; time: number };

export const initialPlayerState: PlayerState = {
  isPlaying: false,
  currentTime: 0,
  rate: 1,
  loop: { enabled: false, region: null },
};

function sanitiseTime(time: number): number | null {
  return Number.isFinite(time) ? Math.max(0, time) : null;
}

function isValidRegion(region: LoopRegion): boolean {
  return (
    Number.isFinite(region.start) &&
    Number.isFinite(region.end) &&
    region.start >= 0 &&
    region.end > region.start
  );
}

function reduceLoop(loop: LoopState, event: Extract<PlayerEvent, { type: "setLoop" }>): LoopState {
  let region = loop.region;
  if (event.region !== undefined) {
    if (event.region !== null && !isValidRegion(event.region)) {
      return loop;
    }
    region = event.region;
  }
  const enabled = region === null ? false : (event.enabled ?? loop.enabled);
  if (region === loop.region && enabled === loop.enabled) {
    return loop;
  }
  return { enabled, region };
}

/** Pure player state transitions. Unchanged state is returned as the same object, so React skips the render. */
export function playerReducer(state: PlayerState, event: PlayerEvent): PlayerState {
  switch (event.type) {
    case "play":
      return state.isPlaying ? state : { ...state, isPlaying: true };
    case "pause":
      return state.isPlaying ? { ...state, isPlaying: false } : state;
    case "seek":
    case "mediaTime": {
      const time = sanitiseTime(event.time);
      if (time === null || time === state.currentTime) {
        return state;
      }
      return { ...state, currentTime: time };
    }
    case "setRate":
      return state.rate === event.rate ? state : { ...state, rate: event.rate };
    case "setLoop": {
      const loop = reduceLoop(state.loop, event);
      return loop === state.loop ? state : { ...state, loop };
    }
  }
}

/** Whether a `timeupdate` at `nowMs` may be forwarded as a `mediaTime` event, given the last forward at `lastMs`. */
export function shouldReportMediaTime(lastMs: number | null, nowMs: number): boolean {
  return lastMs === null || nowMs - lastMs >= MEDIA_TIME_INTERVAL_MS;
}
