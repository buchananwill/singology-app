import { describe, expect, it } from "vitest";

import { groupBy } from "./groupBy";

describe("groupBy", () => {
  it("groups items by key, keeping first-seen key order and item order", () => {
    const groups = groupBy([1, 2, 3, 4, 5, 6], (n) => (n % 3 === 0 ? "three" : "other"));
    expect([...groups.entries()]).toEqual([
      ["other", [1, 2, 4, 5]],
      ["three", [3, 6]],
    ]);
  });

  it("returns an empty map for no items", () => {
    expect(groupBy([], (n: number) => n).size).toBe(0);
  });
});
