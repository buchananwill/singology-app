import type { TransportConfig } from "./transport";

// Vars widen to string: the generated literals would pin every caller to today's placeholders.
export type NudgeEnv = Pick<Env, "HYPERDRIVE"> &
  Record<keyof Pick<Env, "APP_ORIGIN">, string> &
  TransportConfig;
