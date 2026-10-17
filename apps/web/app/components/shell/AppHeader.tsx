import { Anchor, Badge, Button, Group, Text } from "@mantine/core";
import type { Me } from "@singology/shared";
import { Form, href, Link } from "react-router";

import { ROLE_LABEL } from "../../lib/format";
import { homeFor, rolesOf } from "../../lib/roles";

export interface AppHeaderProps {
  me: Me | null;
}

export function AppHeader({ me }: AppHeaderProps) {
  return (
    <Group h="100%" px="md" justify="space-between" wrap="nowrap">
      <Anchor component={Link} to={homeFor(me)} fw={700} fz="xl" c="inherit" underline="never">
        Singology
      </Anchor>
      {me === null ? (
        <Button component={Link} to={href("/sign-in")} size="xs" variant="light">
          Sign in
        </Button>
      ) : (
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" visibleFrom="sm" data-testid="signed-in-name">
            {me.profile.displayName}
          </Text>
          {rolesOf(me).map((role) => (
            <Badge key={role} variant="light" data-testid="role-badge">
              {ROLE_LABEL[role]}
            </Badge>
          ))}
          <Form method="post" action={href("/sign-out")}>
            <Button type="submit" size="xs" variant="subtle">
              Sign out
            </Button>
          </Form>
        </Group>
      )}
    </Group>
  );
}
