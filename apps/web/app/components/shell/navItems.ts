import type { DemoRole } from "@singology/shared";
import { href } from "react-router";

export interface NavItem {
  label: string;
  to: string;
  /** Defaults to an exact match on `to`. */
  isActive?(pathname: string): boolean;
}

const LIBRARY_NAV_ITEM: NavItem = { label: "Library", to: href("/library") };

// The first item of each role is that role's home.
export const NAV_ITEMS: Record<DemoRole, readonly [NavItem, ...NavItem[]]> = {
  student: [
    {
      label: "This week",
      to: href("/student"),
      isActive: (pathname) =>
        pathname === "/student" ||
        pathname.startsWith("/student/exercises/") ||
        pathname.startsWith("/student/submissions/"),
    },
    LIBRARY_NAV_ITEM,
    { label: "Progress", to: href("/student/progress") },
  ],
  coach: [
    // The queue stays current inside a review (/coach/reviews/:id).
    { label: "Queue", to: href("/coach"), isActive: (pathname) => pathname.startsWith("/coach") },
    LIBRARY_NAV_ITEM,
  ],
};

export const HOME_FOR_ROLE: Record<DemoRole, string> = {
  student: NAV_ITEMS.student[0].to,
  coach: NAV_ITEMS.coach[0].to,
};
