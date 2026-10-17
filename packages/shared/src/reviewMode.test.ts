import { describe, expect, it } from "vitest";

import { SUBMISSION_STATUSES } from "./constants";
import { isUnplayableStatus, reviewModeOf } from "./reviewMode";

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

describe("isUnplayableStatus", () => {
  it("knows which submission states have nothing to play", () => {
    expect(SUBMISSION_STATUSES.filter(isUnplayableStatus)).toEqual(["processing", "failed"]);
  });
});
