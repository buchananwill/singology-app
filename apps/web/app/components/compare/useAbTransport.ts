import { useCallback, useEffect, useRef, useState } from "react";

import type { PlayerHandle } from "../player/PlayerProvider";

export type AbSide = "a" | "b";

export interface AbTransport {
  active: AbSide;
  playing: boolean;
  setHandleA: (handle: PlayerHandle | null) => void;
  setHandleB: (handle: PlayerHandle | null) => void;
  switchTo: (next: AbSide) => void;
  togglePlay: () => void;
}

function other(side: AbSide): AbSide {
  return side === "a" ? "b" : "a";
}

// Only one take plays at a time, even when a player's own Play button is used.
export function useAbTransport(): AbTransport {
  const handles = useRef<Record<AbSide, PlayerHandle | null>>({ a: null, b: null });
  const [active, setActive] = useState<AbSide>("a");
  const [playing, setPlaying] = useState(false);

  const setHandleA = useCallback((handle: PlayerHandle | null) => {
    handles.current.a = handle;
  }, []);
  const setHandleB = useCallback((handle: PlayerHandle | null) => {
    handles.current.b = handle;
  }, []);

  useEffect(() => {
    const elements = {
      a: handles.current.a?.getMediaElement() ?? null,
      b: handles.current.b?.getMediaElement() ?? null,
    };
    const cleanups: (() => void)[] = [];
    for (const side of ["a", "b"] as const) {
      const element = elements[side];
      if (element === null) {
        continue;
      }
      const onPlay = () => {
        elements[other(side)]?.pause();
        setActive(side);
        setPlaying(true);
      };
      const onPause = () => {
        if (elements[other(side)]?.paused ?? true) {
          setPlaying(false);
        }
      };
      element.addEventListener("play", onPlay);
      element.addEventListener("pause", onPause);
      cleanups.push(() => {
        element.removeEventListener("play", onPlay);
        element.removeEventListener("pause", onPause);
      });
    }
    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, []);

  function switchTo(next: AbSide) {
    const from = handles.current[active];
    const to = handles.current[next];
    setActive(next);
    if (next === active || !from || !to) {
      return;
    }
    const wasPlaying = playing;
    const position = from.getCurrentTime();
    from.pause();
    to.seek(position);
    if (wasPlaying) {
      void to.play();
    }
  }

  function togglePlay() {
    const handle = handles.current[active];
    if (!handle) {
      return;
    }
    if (playing) {
      handles.current.a?.pause();
      handles.current.b?.pause();
    } else {
      void handle.play();
    }
  }

  return { active, playing, setHandleA, setHandleB, switchTo, togglePlay };
}
