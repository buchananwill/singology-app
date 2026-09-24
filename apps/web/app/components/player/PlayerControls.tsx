import { Button, Group, SegmentedControl, Switch, Text } from "@mantine/core";

import { formatTimestamp } from "../../lib/format";
import { usePlayer } from "./PlayerProvider";
import { PLAYBACK_RATES, type PlaybackRate } from "./playerReducer";

export interface PlayerControlsProps {
  durationSec: number;
  onClearLoop: () => void;
}

function toPlaybackRate(value: string): PlaybackRate | undefined {
  return PLAYBACK_RATES.find((rate) => String(rate) === value);
}

export function PlayerControls({ durationSec, onClearLoop }: PlayerControlsProps) {
  const { state, dispatch, handle } = usePlayer();
  return (
    <Group gap="sm" wrap="wrap">
      <Button
        size="xs"
        onClick={() => (state.isPlaying ? handle.pause() : void handle.play())}
        aria-label={state.isPlaying ? "Pause" : "Play"}
      >
        {state.isPlaying ? "Pause" : "Play"}
      </Button>
      <Text size="sm" ff="monospace" data-testid="player-time">
        {formatTimestamp(state.currentTime)} / {formatTimestamp(durationSec)}
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
        onClick={onClearLoop}
        disabled={state.loop.region === null}
      >
        Clear loop
      </Button>
    </Group>
  );
}
