import { describe, expect, it } from "vitest";

import { firstName } from "./names";

describe("firstName", () => {
  it("takes the first word of a display name", () => {
    expect(firstName("Ada Lovelace")).toBe("Ada");
    expect(firstName("Ada")).toBe("Ada");
  });
});
