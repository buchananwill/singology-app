import { describe, expect, it } from "vitest";

import { LibraryFilterSchema } from "./schemas";

describe("LibraryFilterSchema", () => {
  it("keeps known values", () => {
    expect(LibraryFilterSchema.parse({ category: "range", voiceType: "bass" })).toEqual({
      category: "range",
      voiceType: "bass",
    });
  });

  it("drops unknown and missing values instead of failing", () => {
    const filter = LibraryFilterSchema.parse({ category: "nope", voiceType: null });
    expect(filter.category).toBeUndefined();
    expect(filter.voiceType).toBeUndefined();
  });
});
