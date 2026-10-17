import type { Me } from "@singology/shared";
import { describe, expect, it } from "vitest";

import { holdsRole, homeFor, rolesOf } from "./roles";

const profile = { id: "u1", displayName: "Singology CTO" };
const student: Me["student"] = { ...profile, voiceType: "mezzo" };
const coach: Me["coach"] = {
  ...profile,
  tier: "standard",
  bio: "",
  avatarSrc: "/avatars/coach-standard.svg",
  turnaroundHours: 72,
};

describe("the roles a user holds", () => {
  it("are the rows present, in display order", () => {
    expect(rolesOf({ profile, student, coach })).toEqual(["student", "coach"]);
    expect(rolesOf({ profile, student: null, coach })).toEqual(["coach"]);
    expect(holdsRole({ profile, student, coach: null }, "coach")).toBe(false);
  });

  it("choose the home: student, else coach, else the landing page", () => {
    expect(homeFor(null)).toBe("/");
    expect(homeFor({ profile, student, coach })).toBe("/student");
    expect(homeFor({ profile, student: null, coach })).toBe("/coach");
    expect(homeFor({ profile, student: null, coach: null })).toBe("/");
  });
});
