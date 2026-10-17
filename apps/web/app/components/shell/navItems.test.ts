import type { Me } from "@singology/shared";
import { assert, describe, expect, it } from "vitest";

import { isNavItemActive, navItemsFor } from "./navItems";

const profile = { id: "u1", displayName: "Singology CTO" };
const student: Me["student"] = { ...profile, voiceType: "mezzo" };
const coach: Me["coach"] = {
  ...profile,
  tier: "standard",
  bio: "",
  avatarSrc: "/avatars/coach-standard.svg",
  turnaroundHours: 72,
};

const labels = (me: Me) => navItemsFor(me).map((item) => item.label);

describe("navItemsFor", () => {
  it("lists student items, then coach items, then Library once", () => {
    expect(labels({ profile, student, coach })).toEqual([
      "This week",
      "Progress",
      "Queue",
      "Library",
    ]);
    expect(labels({ profile, student, coach: null })).toEqual(["This week", "Progress", "Library"]);
    expect(labels({ profile, student: null, coach })).toEqual(["Queue", "Library"]);
  });
});

describe("isNavItemActive", () => {
  it("keeps Queue current inside a review and matches Library exactly", () => {
    const [queue, library] = navItemsFor({ profile, student: null, coach });
    assert(queue && library, "the coach nav has Queue and Library");
    expect(isNavItemActive(queue, "/coach/reviews/abc")).toBe(true);
    expect(isNavItemActive(library, "/library")).toBe(true);
    expect(isNavItemActive(library, "/library/x")).toBe(false);
  });
});
