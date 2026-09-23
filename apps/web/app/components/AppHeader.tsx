import { Anchor, Group } from "@mantine/core";
import { Link } from "react-router";

export function AppHeader() {
  return (
    <Group h="100%" px="md" justify="space-between">
      <Anchor component={Link} to="/" fw={700} fz="xl" c="inherit" underline="never">
        Singology
      </Anchor>
    </Group>
  );
}
