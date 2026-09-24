import { useSyncExternalStore } from "react";

/** How often the clock ticks after hydration. Countdowns show minutes, so this is plenty. */
const CLOCK_TICK_MS = 15_000;

function subscribe(onTick: () => void): () => void {
  const timer = window.setInterval(onTick, CLOCK_TICK_MS);
  return () => window.clearInterval(timer);
}

let latest = 0;

/**
 * The browser clock, re-read at most once a tick so repeated reads between
 * ticks return the same value. It is never rounded down: a rounded value
 * could sit below the server's request time and make the first client
 * update read "61 hours ago" where the server said "62 hours ago".
 */
function getSnapshot(): number {
  const now = Date.now();
  if (now - latest >= CLOCK_TICK_MS) {
    latest = now;
  }
  return latest;
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
