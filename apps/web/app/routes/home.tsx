import { Container, Text, Title } from "@mantine/core";

import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [{ title: "Singology" }];

export default function Home() {
  return (
    <Container size="sm">
      <Title order={1}>Singology</Title>
      <Text c="dimmed">Facade scaffold.</Text>
    </Container>
  );
}
