import type { Me } from "@singology/shared";
import { describe, expect, it } from "vitest";

import { homeFor, navItemsFor, rolesOf } from "./navItems";

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

describe("navigation for the roles a user holds", () => {
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

  it("names every role held", () => {
    expect(rolesOf({ profile, student, coach })).toEqual(["student", "coach"]);
    expect(rolesOf({ profile, student: null, coach })).toEqual(["coach"]);
  });

  it("sends a student home to the student home, and a coach only to the queue", () => {
    expect(homeFor(null)).toBe("/");
    expect(homeFor({ profile, student, coach })).toBe("/student");
    expect(homeFor({ profile, student: null, coach })).toBe("/coach");
  });
});
