import { describe, expect, it } from "vitest";

import { indexById } from "./indexById";

describe("indexById", () => {
  it("maps each item's id to the item", () => {
    const a = { id: "a", n: 1 };
    const b = { id: "b", n: 2 };
    const index = indexById([a, b]);
    expect(index.get("a")).toBe(a);
    expect(index.get("b")).toBe(b);
    expect(index.size).toBe(2);
  });

  it("keeps the last item for a repeated id", () => {
    expect(
      indexById([
        { id: "a", n: 1 },
        { id: "a", n: 2 },
      ]).get("a")?.n,
    ).toBe(2);
  });
});
