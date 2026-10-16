import { type Me, USER_ROLES, type UserRole } from "@singology/shared";
import { href } from "react-router";

export interface NavItem {
  label: string;
  to: string;
  /** Defaults to an exact match on `to`. */
  isActive?(pathname: string): boolean;
}

// The first item of each role is that role's home.
const ROLE_NAV_ITEMS: Record<UserRole, readonly [NavItem, ...NavItem[]]> = {
  student: [
    {
      label: "This week",
      to: href("/student"),
      isActive: (pathname) =>
        pathname === "/student" ||
        pathname.startsWith("/student/exercises/") ||
        pathname.startsWith("/student/submissions/"),
    },
    { label: "Progress", to: href("/student/progress") },
  ],
  coach: [
    // The queue stays current inside a review (/coach/reviews/:id).
    { label: "Queue", to: href("/coach"), isActive: (pathname) => pathname.startsWith("/coach") },
  ],
};

const LIBRARY_NAV_ITEM: NavItem = { label: "Library", to: href("/library") };

/** Every role the user holds, student items first, then coach items, then Library once. */
export function navItemsFor(me: Me): NavItem[] {
  return [...rolesOf(me).flatMap((role) => ROLE_NAV_ITEMS[role]), LIBRARY_NAV_ITEM];
}

/** `Me` names each role's row after the role. */
export function rolesOf(me: Me): UserRole[] {
  return USER_ROLES.filter((role) => me[role] !== null);
}

/** A student who also coaches lands on the student home and reaches the queue from the nav. */
export function homeFor(me: Me | null): string {
  if (me === null) {
    return href("/");
  }
  return me.student !== null ? ROLE_NAV_ITEMS.student[0].to : ROLE_NAV_ITEMS.coach[0].to;
}
