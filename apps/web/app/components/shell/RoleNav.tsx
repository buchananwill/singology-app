import { Button, Group } from "@mantine/core";
import type { DemoRole } from "@singology/shared";
import { Link, useLocation } from "react-router";

import { NAV_ITEMS } from "./navItems";

export interface RoleNavProps {
  role: DemoRole;
}

/** Short labels so all fit in one row at 375px. */
export function RoleNav({ role }: RoleNavProps) {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Main">
      <Group gap="xxs" mb="md" wrap="nowrap">
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
