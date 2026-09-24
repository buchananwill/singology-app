import {
  createContext,
  type Dispatch,
  type ReactNode,
  type RefObject,
  useContext,
  useMemo,
  useReducer,
  useRef,
} from "react";

import {
  initialPlayerState,
  type PlayerEvent,
  type PlayerState,
  playerReducer,
} from "./playerReducer";

/**
 * Imperative access to one player, for parents that need the exact media
 * position (e.g. "add comment at current time") or a shared transport
 * (e.g. the A/B compare). Every method reads the media element at call time.
 */
export interface PlayerHandle {
  /** Exact current position in seconds, read from the media element (not the throttled state). */
  getCurrentTime(): number;
  /** Seek to `timeSec`; the waveform cursor follows. */
  seek(timeSec: number): void;
  play(): Promise<void>;
  pause(): void;
  /** The underlying `<audio>` or `<video>`, or `null` before it mounts. */
  getMediaElement(): HTMLMediaElement | null;
}

export interface PlayerContextValue {
  state: PlayerState;
  dispatch: Dispatch<PlayerEvent>;
  handle: PlayerHandle;
  /** Attached by `WaveformPlayer` to its media element. Internal to the player folder. */
  mediaRef: RefObject<HTMLMediaElement | null>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

/** Owns one player's typed state (`useReducer`) and media element ref. Wrap each `WaveformPlayer` in one. */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState);
  const mediaRef = useRef<HTMLMediaElement | null>(null);

  const handle = useMemo<PlayerHandle>(
    () => ({
      getCurrentTime: () => mediaRef.current?.currentTime ?? 0,
      seek: (timeSec) => {
        const media = mediaRef.current;
        if (media && Number.isFinite(timeSec)) {
          media.currentTime = Math.max(0, timeSec);
        }
      },
      play: async () => {
        await mediaRef.current?.play();
      },
      pause: () => {
        mediaRef.current?.pause();
      },
      getMediaElement: () => mediaRef.current,
    }),
    [],
  );

  const value = useMemo<PlayerContextValue>(
    () => ({ state, dispatch, handle, mediaRef }),
    [state, handle],
  );

  return <PlayerContext value={value}>{children}</PlayerContext>;
}

/** The nearest `PlayerProvider`'s state, dispatch and handle. Throws outside a provider. */
export function usePlayer(): PlayerContextValue {
  const value = useContext(PlayerContext);
  if (value === null) {
    throw new Error("usePlayer must be used inside a <PlayerProvider>");
  }
  return value;
}
