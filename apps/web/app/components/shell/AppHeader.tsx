import { Anchor, Badge, Button, Group } from "@mantine/core";
import type { DemoRole } from "@singology/shared";
import { href, Link } from "react-router";

const ROLE_LABEL: Record<DemoRole, string> = {
  student: "Student view",
  coach: "Coach view",
};

export interface AppHeaderProps {
  /** The role picked on `/demo`, or `null` before one is picked. */
  role: DemoRole | null;
}

/** Brand link, plus the current demo role and a way back to the role switcher. */
export function AppHeader({ role }: AppHeaderProps) {
  return (
    <Group h="100%" px="md" justify="space-between" wrap="nowrap">
      <Anchor component={Link} to={href("/")} fw={700} fz="xl" c="inherit" underline="never">
        Singology
      </Anchor>
      {role === null ? (
        <Button component={Link} to={href("/demo")} size="xs" variant="light">
          Try the demo
        </Button>
      ) : (
        <Group gap="xs" wrap="nowrap">
          <Badge variant="light" data-testid="current-role">
            {ROLE_LABEL[role]}
          </Badge>
          <Anchor component={Link} to={href("/demo")} size="sm">
            Switch view
          </Anchor>
        </Group>
      )}
    </Group>
  );
}
