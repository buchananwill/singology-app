import { Button, Card, Group, SegmentedControl, SimpleGrid, Stack, Text } from "@mantine/core";
import type { MediaAsset } from "@singology/shared";

import { StandalonePlayer } from "../player/StandalonePlayer";
import { type AbSide, useAbTransport } from "./useAbTransport";

export interface AbTake {
  asset: MediaAsset;
  /** Short label, e.g. the take's date. */
  label: string;
}

interface AbCompareProps {
  a: AbTake;
  b: AbTake;
}

/** Key it by the two takes so a new pair remounts it. */
export function AbCompare({ a, b }: AbCompareProps) {
  const { active, playing, setHandleA, setHandleB, switchTo, togglePlay } = useAbTransport();
  const takes: Record<AbSide, AbTake> = { a, b };

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
            <StandalonePlayer
              asset={takes[side].asset}
              label={`Take ${side.toUpperCase()}`}
              height={64}
              ref={side === "a" ? setHandleA : setHandleB}
            />
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
