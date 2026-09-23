import { useSyncExternalStore } from "react";

/** How often the clock ticks after hydration. Countdowns show minutes, so this is plenty. */
export const CLOCK_TICK_MS = 15_000;

function subscribe(onTick: () => void): () => void {
  const timer = window.setInterval(onTick, CLOCK_TICK_MS);
  return () => window.clearInterval(timer);
}

/** Rounded down to the tick, so repeated reads between ticks return the same value. */
function getSnapshot(): number {
  return Math.floor(Date.now() / CLOCK_TICK_MS) * CLOCK_TICK_MS;
}

/**
 * The current time in milliseconds, as a clock source for live countdowns
 * (journal decision 32). During SSR and hydration it returns `serverNow` (the
 * loader's request time), so the server HTML equals the first client render.
 * After hydration it follows the browser clock, re-rendering every tick. No
 * state is set in an effect: React owns the subscription.
 */
export function useNow(serverNow: number): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverNow);
}
