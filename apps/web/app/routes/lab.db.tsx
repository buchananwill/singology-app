import { Container, Stack, Text, Title } from "@mantine/core";
import { countActiveCoaches, createUserDb } from "@singology/db";
import { env } from "cloudflare:workers";

import type { Route } from "./+types/lab.db";

export const meta: Route.MetaFunction = () => [
  { title: "Database lab | Singology" },
  { name: "robots", content: "noindex" },
];

// The Worker-to-Postgres proof: Hyperdrive, then one RLS transaction as anon. Under `wrangler dev`
// the binding's connection string comes from WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE.
export async function loader() {
  const db = createUserDb(env.HYPERDRIVE.connectionString, { role: "anon" });
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
