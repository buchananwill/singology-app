import { useSyncExternalStore } from "react";

/** How often the clock ticks after hydration. Countdowns show minutes, so this is plenty. */
const CLOCK_TICK_MS = 15_000;

function subscribe(onTick: () => void): () => void {
  const timer = window.setInterval(onTick, CLOCK_TICK_MS);
  return () => window.clearInterval(timer);
}

let latest = 0;

/** Never rounded: the first client value must not precede the server's. */
function getSnapshot(): number {
  const now = Date.now();
  if (now - latest >= CLOCK_TICK_MS) {
    latest = now;
  }
  return latest;
}

/** Returns `serverNow` during SSR and hydration, then follows the browser clock. */
export function useNow(serverNow: number): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverNow);
}
