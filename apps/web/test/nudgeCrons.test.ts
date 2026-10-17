import { readFileSync } from "node:fs";

import { NUDGE_CRONS } from "@singology/shared";
import { describe, expect, it } from "vitest";

const wranglerConfig = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");

describe("wrangler.jsonc", () => {
  it("declares exactly the Cron Triggers the nudge sender branches on", () => {
    const crons = /"crons":\s*(\[[^\]]*\])/.exec(wranglerConfig)?.[1];
    expect(crons).toBeDefined();
    expect(JSON.parse(crons ?? "[]")).toEqual(Object.values(NUDGE_CRONS));
  });
});
