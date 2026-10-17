import { assert, describe, expect, it } from "vitest";

import { isNavItemActive, LIBRARY_NAV_ITEM, ROLE_NAV_ITEMS } from "./navItems";

describe("isNavItemActive", () => {
  it("keeps Queue current inside a review and matches Library exactly", () => {
    const [queue] = ROLE_NAV_ITEMS.coach;
    assert(queue, "the coach nav has the queue");
    expect(isNavItemActive(queue, "/coach/reviews/abc")).toBe(true);
    expect(isNavItemActive(LIBRARY_NAV_ITEM, "/library")).toBe(true);
    expect(isNavItemActive(LIBRARY_NAV_ITEM, "/library/x")).toBe(false);
  });
});
