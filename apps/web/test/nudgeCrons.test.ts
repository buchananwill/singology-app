import { fileURLToPath } from "node:url";

import { NUDGE_CRONS } from "@singology/shared";
import { describe, expect, it } from "vitest";
import { experimental_readRawConfig } from "wrangler";

describe("wrangler.jsonc", () => {
  it("declares exactly the Cron Triggers the nudge sender branches on", () => {
    const { rawConfig } = experimental_readRawConfig({
      config: fileURLToPath(new URL("../wrangler.jsonc", import.meta.url)),
    });
    expect(rawConfig.triggers?.crons).toEqual(Object.values(NUDGE_CRONS));
  });
});
