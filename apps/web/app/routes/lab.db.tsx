import { Container, Stack, Text, Title } from "@mantine/core";
import { countActiveCoaches, createUserDb } from "@singology/db";
import { env } from "cloudflare:workers";

import type { Route } from "./+types/lab.db";

export const meta: Route.MetaFunction = () => [
  { title: "Database lab | Singology" },
  { name: "robots", content: "noindex" },
];

// The Worker-to-Postgres proof: Hyperdrive, then one RLS transaction as anon. The binding's fields
// go straight through; the Worker never parses a connection URL.
export async function loader() {
  const db = createUserDb(env.HYPERDRIVE, { role: "anon" });
  return { activeCoaches: await countActiveCoaches(db) };
}

export default function DatabaseLab({ loaderData }: Route.ComponentProps) {
  return (
    <Container size="lg">
      <Stack gap="xs">
        <Title order={1}>Database lab</Title>
        <Text c="dimmed">
          Worker to Postgres through Hyperdrive, as anon. Not linked from the app.
        </Text>
        <Text data-testid="active-coaches">Active coaches: {loaderData.activeCoaches}</Text>
      </Stack>
    </Container>
  );
}
