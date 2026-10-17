import { describe, expect, it } from "vitest";

import { reviewModeOf, SUBMISSION_STATUSES } from "./constants";

describe("reviewModeOf", () => {
  it("opens only a reviewed take read-only", () => {
    expect(SUBMISSION_STATUSES.map((status) => [status, reviewModeOf({ status })])).toEqual([
      ["processing", "reviewing"],
      ["awaiting_review", "reviewing"],
      ["reviewed", "reviewed"],
      ["failed", "reviewing"],
    ]);
  });
});
