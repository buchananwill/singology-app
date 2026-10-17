import type { EventRepository } from "@singology/db";
import { describe, expect, it, vi } from "vitest";

import { recordEventBestEffort } from "./recordEvent";

describe("recordEventBestEffort", () => {
  it("logs a failed insert by kind and resolves", async () => {
    const events: EventRepository = { record: () => Promise.reject(new Error("insert failed")) };
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(recordEventBestEffort(events, { kind: "signed_in" })).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith("signed_in event not recorded", expect.any(Error));
    log.mockRestore();
  });
});
