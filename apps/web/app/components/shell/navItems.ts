import type { DemoRole } from "@singology/shared";
import { href } from "react-router";

export interface NavItem {
  label: string;
  to: string;
  isActive(pathname: string): boolean;
}

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
    { label: "Library", to: href("/library"), isActive: (pathname) => pathname === "/library" },
    {
      label: "Progress",
      to: href("/student/progress"),
      isActive: (pathname) => pathname === "/student/progress",
    },
  ],
  coach: [
    // The queue stays current inside a review (/coach/reviews/:id).
    { label: "Queue", to: href("/coach"), isActive: (pathname) => pathname.startsWith("/coach") },
    { label: "Library", to: href("/library"), isActive: (pathname) => pathname === "/library" },
  ],
};

export const HOME_FOR_ROLE: Record<DemoRole, string> = {
  student: NAV_ITEMS.student[0].to,
  coach: NAV_ITEMS.coach[0].to,
};
