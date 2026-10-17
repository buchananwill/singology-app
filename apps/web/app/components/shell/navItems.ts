import type { Me, UserRole } from "@singology/shared";
import { href } from "react-router";

import { ROLE_HOME, rolesOf } from "../../lib/roles";

export interface NavItem {
  label: string;
  to: string;
  /** Defaults to an exact match on `to`. */
  isActive?(pathname: string): boolean;
}

// Short labels: every item of both roles, plus Library, fits one row at 375px.
const ROLE_NAV_ITEMS: Record<UserRole, readonly NavItem[]> = {
  student: [
    {
      label: "This week",
      to: ROLE_HOME.student,
      isActive: (pathname) =>
        pathname === ROLE_HOME.student ||
        pathname.startsWith("/student/exercises/") ||
        pathname.startsWith("/student/submissions/"),
    },
    { label: "Progress", to: href("/student/progress") },
  ],
  coach: [
    // The queue stays current inside a review (/coach/reviews/:id).
    {
      label: "Queue",
      to: ROLE_HOME.coach,
      isActive: (pathname) => pathname.startsWith(ROLE_HOME.coach),
    },
  ],
};

const LIBRARY_NAV_ITEM: NavItem = { label: "Library", to: href("/library") };

export function navItemsFor(me: Me): NavItem[] {
  return [...rolesOf(me).flatMap((role) => ROLE_NAV_ITEMS[role]), LIBRARY_NAV_ITEM];
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return item.isActive ? item.isActive(pathname) : pathname === item.to;
}
