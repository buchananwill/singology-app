import { describe, expect, it } from "vitest";

import { fixtureUuid } from "./fixtureUuid";

const UUID_V5 = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("fixtureUuid", () => {
  it("is a stable version 5 uuid, distinct per fixture id", () => {
    const hiss = fixtureUuid("lib-breath-hiss");
    expect(hiss).toMatch(UUID_V5);
    expect(fixtureUuid("lib-breath-hiss")).toBe(hiss);
    expect(fixtureUuid("lib-breath-lip-trill")).not.toBe(hiss);
  });
});
