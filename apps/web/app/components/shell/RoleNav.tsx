import { Button, Group } from "@mantine/core";
import type { DemoRole } from "@singology/shared";
import { Link, useLocation } from "react-router";

interface NavItem {
  label: string;
  to: string;
  /** Whether the item is the current section for `pathname`. */
  isActive(pathname: string): boolean;
}

const NAV_ITEMS: Record<DemoRole, readonly NavItem[]> = {
  student: [
    {
      label: "This week",
      to: "/student",
      isActive: (pathname) =>
        pathname === "/student" ||
        pathname.startsWith("/student/exercises/") ||
        pathname.startsWith("/student/submissions/"),
    },
    { label: "Library", to: "/library", isActive: (pathname) => pathname === "/library" },
    {
      label: "Progress",
      to: "/student/progress",
      isActive: (pathname) => pathname === "/student/progress",
    },
  ],
  coach: [
    // The queue stays current inside a review (/coach/reviews/:id).
    { label: "Queue", to: "/coach", isActive: (pathname) => pathname.startsWith("/coach") },
    { label: "Library", to: "/library", isActive: (pathname) => pathname === "/library" },
  ],
};

/** The section links for the current role. Short labels so all fit in one row at 375px. */
export function RoleNav({ role }: { role: DemoRole }) {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Main">
      <Group gap={4} mb="md" wrap="nowrap">
        {NAV_ITEMS[role].map((item) => {
          const active = item.isActive(pathname);
          return (
            <Button
              key={item.to}
              component={Link}
              to={item.to}
              variant={active ? "light" : "subtle"}
              size="compact-md"
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Button>
          );
        })}
      </Group>
    </nav>
  );
}
