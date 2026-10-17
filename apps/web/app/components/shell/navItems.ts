import type { UserRole } from "@singology/shared";
import { href } from "react-router";

export interface NavItem {
  label: string;
  to: string;
  /** Defaults to an exact match on `to`. */
  isActive?(pathname: string): boolean;
}

// Short labels: every item of both roles, plus Library, fits one row at 375px.
export const ROLE_NAV_ITEMS: Record<UserRole, readonly NavItem[]> = {
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

export const LIBRARY_NAV_ITEM: NavItem = { label: "Library", to: href("/library") };

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return item.isActive ? item.isActive(pathname) : pathname === item.to;
}
