import { Container, List, Text, Title } from "@mantine/core";

import { repositoriesContext } from "../context";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [{ title: "Singology" }];

export async function loader({ context }: Route.LoaderArgs) {
  const repositories = context.get(repositoriesContext);
  const coaches = await repositories.coaches.list();
  return { coaches: coaches.map((coach) => ({ id: coach.id, name: coach.displayName })) };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <Container size="sm">
      <Title order={1}>Singology</Title>
      <Text c="dimmed">Coaches</Text>
      <List>
        {loaderData.coaches.map((coach) => (
          <List.Item key={coach.id} data-testid="coach-name">
            {coach.name}
          </List.Item>
        ))}
      </List>
    </Container>
  );
}
