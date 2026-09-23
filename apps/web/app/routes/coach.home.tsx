import { Container, Text, Title } from "@mantine/core";

import type { Route } from "./+types/coach.home";

export const meta: Route.MetaFunction = () => [{ title: "Coach view | Singology" }];

/**
 * Placeholder until the coach surfaces (spec decision 16) are built. The
 * loader exists so the coach layout's server middleware (the role guard) also
 * runs on client-side navigations, which only call the server when a loader does.
 */
export function loader() {
  return null;
}

export default function CoachHome() {
  return (
    <Container size="md">
      <Title order={1}>Coach view</Title>
      <Text c="dimmed" data-testid="coach-placeholder">
        Coach view: coming in the next stage
      </Text>
    </Container>
  );
}
