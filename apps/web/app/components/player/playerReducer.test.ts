import { describe, expect, it } from "vitest";

import {
  initialPlayerState,
  MEDIA_TIME_INTERVAL_MS,
  type PlayerState,
  playerReducer,
  shouldReportMediaTime,
} from "./playerReducer";

const withRegion: PlayerState = {
  ...initialPlayerState,
  loop: { enabled: false, region: { start: 2, end: 5 } },
};

describe("playerReducer", () => {
  it("tracks play and pause, returning the same state when nothing changes", () => {
    const playing = playerReducer(initialPlayerState, { type: "play" });
    expect(playing.isPlaying).toBe(true);
    expect(playerReducer(playing, { type: "play" })).toBe(playing);
    const paused = playerReducer(playing, { type: "pause" });
    expect(paused.isPlaying).toBe(false);
    expect(playerReducer(paused, { type: "pause" })).toBe(paused);
  });

  it("sets the time on seek and mediaTime, ignoring repeats and invalid values", () => {
    const seeked = playerReducer(initialPlayerState, { type: "seek", time: 12.5 });
    expect(seeked.currentTime).toBe(12.5);
    expect(playerReducer(seeked, { type: "mediaTime", time: 12.5 })).toBe(seeked);
    expect(playerReducer(seeked, { type: "mediaTime", time: Number.NaN })).toBe(seeked);
    expect(playerReducer(seeked, { type: "mediaTime", time: 13 }).currentTime).toBe(13);
    expect(playerReducer(seeked, { type: "seek", time: -3 }).currentTime).toBe(0);
  });

  it("sets the playback rate", () => {
    const slow = playerReducer(initialPlayerState, { type: "setRate", rate: 0.75 });
    expect(slow.rate).toBe(0.75);
    expect(playerReducer(slow, { type: "setRate", rate: 0.75 })).toBe(slow);
  });

  it("cannot enable the loop without a region", () => {
    expect(playerReducer(initialPlayerState, { type: "setLoop", enabled: true })).toBe(
      initialPlayerState,
    );
  });

  it("sets a region and toggles looping on it", () => {
    const created = playerReducer(initialPlayerState, {
      type: "setLoop",
      region: { start: 1, end: 4 },
      enabled: true,
    });
    expect(created.loop).toEqual({ enabled: true, region: { start: 1, end: 4 } });
    const off = playerReducer(created, { type: "setLoop", enabled: false });
    expect(off.loop).toEqual({ enabled: false, region: { start: 1, end: 4 } });
    const moved = playerReducer(off, { type: "setLoop", region: { start: 2, end: 3 } });
    expect(moved.loop).toEqual({ enabled: false, region: { start: 2, end: 3 } });
  });

  it("disables the loop when the region is cleared", () => {
    const on = playerReducer(withRegion, { type: "setLoop", enabled: true });
    const cleared = playerReducer(on, { type: "setLoop", region: null, enabled: true });
    expect(cleared.loop).toEqual({ enabled: false, region: null });
  });

  it("ignores empty or inverted regions", () => {
    expect(playerReducer(withRegion, { type: "setLoop", region: { start: 3, end: 3 } })).toBe(
      withRegion,
    );
    expect(playerReducer(withRegion, { type: "setLoop", region: { start: 4, end: 1 } })).toBe(
      withRegion,
    );
  });
});

describe("shouldReportMediaTime", () => {
  it("reports the first update and then at most once per interval (4 a second)", () => {
    expect(MEDIA_TIME_INTERVAL_MS).toBe(250);
    expect(shouldReportMediaTime(null, 0)).toBe(true);
    expect(shouldReportMediaTime(1_000, 1_100)).toBe(false);
    expect(shouldReportMediaTime(1_000, 1_249)).toBe(false);
    expect(shouldReportMediaTime(1_000, 1_250)).toBe(true);
  });
});
