import { Badge, Button, Card, Container, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { DemoRoleChoiceSchema, type DemoRole } from "@singology/shared";
import { data, Form, redirect } from "react-router";

import { demoRoleContext } from "../context";
import { serializeDemoRole } from "../demo/roleCookie.server";
import { type ActionResult, parseInput } from "../lib/actionResult";
import type { Route } from "./+types/demo";

export const meta: Route.MetaFunction = () => [{ title: "Try the demo | Singology" }];

const HOME_FOR_ROLE: Record<DemoRole, string> = {
  student: "/student",
  coach: "/coach",
};

export function loader({ context }: Route.LoaderArgs) {
  return { role: context.get(demoRoleContext) };
}

export async function action({ request }: Route.ActionArgs) {
  const parsed = parseInput(
    DemoRoleChoiceSchema,
    Object.fromEntries(await request.formData()),
    "The view choice was not valid.",
  );
  if (!parsed.ok) {
    return data<ActionResult>({ ok: false, error: parsed.error }, { status: 400 });
  }
  const { role } = parsed.data;
  return redirect(HOME_FOR_ROLE[role], {
    headers: { "Set-Cookie": await serializeDemoRole(role) },
  });
}

export interface RoleCardProps {
  role: DemoRole;
  title: string;
  description: string;
  current: boolean;
}

function RoleCard({ role, title, description, current }: RoleCardProps) {
  return (
    <Card withBorder padding="lg" data-testid={`role-card-${role}`}>
      <Stack gap="sm" h="100%">
        <Title order={2} size="h3">
          {title}
        </Title>
        <Text c="dimmed" flex={1}>
          {description}
        </Text>
        {current && (
          <Badge variant="light" w="fit-content">
            Current view
          </Badge>
        )}
        <Form method="post">
          <input type="hidden" name="role" value={role} />
          <Button type="submit" fullWidth>
            {title}
          </Button>
        </Form>
      </Stack>
    </Card>
  );
}

export default function Demo({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <Container size="md">
      <Stack gap="lg">
        <div>
          <Title order={1}>Try the demo</Title>
          <Text c="dimmed">
            Choose how you'd like to look around. You can switch at any time from the top of the
            page.
          </Text>
        </div>
        {actionData?.ok === false && (
          <Text c="red" role="alert">
            {actionData.error}
          </Text>
        )}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <RoleCard
            role="student"
            title="View as a student"
            description="See this week's exercises, record and upload a take, and read your coach's timestamped feedback."
            current={loaderData.role === "student"}
          />
          <RoleCard
            role="coach"
            title="View as a coach (founder)"
            description="See the review queue and how a coach listens, comments and sends feedback."
            current={loaderData.role === "coach"}
          />
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
