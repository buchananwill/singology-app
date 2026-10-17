import { Button, Group } from "@mantine/core";
import type { Me } from "@singology/shared";
import { Link, useLocation } from "react-router";

import { rolesOf } from "../../lib/roles";
import { isNavItemActive, LIBRARY_NAV_ITEM, ROLE_NAV_ITEMS } from "./navItems";

export interface RoleNavProps {
  me: Me;
}

export function RoleNav({ me }: RoleNavProps) {
  const { pathname } = useLocation();
  const items = [...rolesOf(me).flatMap((role) => ROLE_NAV_ITEMS[role]), LIBRARY_NAV_ITEM];
  return (
    <nav aria-label="Main">
      <Group gap="xxs" mb="md" wrap="nowrap">
        {items.map((item) => {
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
