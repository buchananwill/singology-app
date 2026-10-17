import { Button, Group } from "@mantine/core";
import type { Me } from "@singology/shared";
import { Link, useLocation } from "react-router";

import { isNavItemActive, navItemsFor } from "./navItems";

export interface RoleNavProps {
  me: Me;
}

export function RoleNav({ me }: RoleNavProps) {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Main">
      <Group gap="xxs" mb="md" wrap="nowrap">
        {navItemsFor(me).map((item) => {
          const active = isNavItemActive(item, pathname);
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
