import { Button, Card, Group, SegmentedControl, SimpleGrid, Stack, Text } from "@mantine/core";
import type { MediaAsset } from "@singology/shared";
import { useCallback, useEffect, useRef, useState } from "react";

import { type PlayerHandle, PlayerProvider } from "../player/PlayerProvider";
import { WaveformPlayer } from "../player/WaveformPlayer";

type Side = "a" | "b";

export interface AbTake {
  asset: MediaAsset;
  /** Short label, e.g. the take's date. */
  label: string;
}

interface AbCompareProps {
  a: AbTake;
  b: AbTake;
}

function other(side: Side): Side {
  return side === "a" ? "b" : "a";
}

/**
 * A/B compare of two takes (spec decision 15): two waveform players side by
 * side, each in its own `PlayerProvider`, and one shared control that plays
 * the chosen take and switches between them at the same position. Only one
 * take plays at a time, even when a player's own Play button is used.
 * Key it by the two takes so a new pair remounts it.
 */
export function AbCompare({ a, b }: AbCompareProps) {
  const handles = useRef<Record<Side, PlayerHandle | null>>({ a: null, b: null });
  const [active, setActive] = useState<Side>("a");
  const [playing, setPlaying] = useState(false);

  const setHandleA = useCallback((handle: PlayerHandle | null) => {
    handles.current.a = handle;
  }, []);
  const setHandleB = useCallback((handle: PlayerHandle | null) => {
    handles.current.b = handle;
  }, []);

  // Follow the media elements, so the shared control stays right when a player's own controls are used.
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

  function switchTo(next: Side) {
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

  const takes: Record<Side, AbTake> = { a, b };

  return (
    <Stack gap="md" data-testid="ab-compare">
      <Card withBorder padding="sm">
        <Group gap="sm" wrap="wrap">
          <Button onClick={togglePlay} data-testid="ab-play" w={96}>
            {playing ? "Pause" : "Play"}
          </Button>
          <SegmentedControl
            aria-label="Take to hear"
            value={active}
            onChange={(value) => switchTo(value === "b" ? "b" : "a")}
            data={[
              { value: "a", label: `A: ${a.label}` },
              { value: "b", label: `B: ${b.label}` },
            ]}
            data-testid="ab-toggle"
          />
        </Group>
        <Text size="xs" c="dimmed" mt="xs">
          Switch while it plays to hear the other take from the same moment.
        </Text>
      </Card>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {(["a", "b"] as const).map((side) => (
          <Card
            key={side}
            withBorder
            padding="sm"
            data-testid={`ab-take-${side}`}
            data-active={active === side ? "true" : "false"}
            style={{
              borderColor: active === side ? "var(--mantine-primary-color-filled)" : undefined,
            }}
          >
            <Text fw={600} size="sm" mb="xs">
              Take {side.toUpperCase()}: {takes[side].label}
            </Text>
            <PlayerProvider>
              <WaveformPlayer
                asset={takes[side].asset}
                label={`Take ${side.toUpperCase()}`}
                height={64}
                ref={side === "a" ? setHandleA : setHandleB}
              />
            </PlayerProvider>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
