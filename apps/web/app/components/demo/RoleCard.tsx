import { Badge, Button, Card, Stack, Text, Title } from "@mantine/core";
import type { DemoRole } from "@singology/shared";
import { Form } from "react-router";

export interface RoleCardProps {
  role: DemoRole;
  title: string;
  description: string;
  current: boolean;
}

export function RoleCard({ role, title, description, current }: RoleCardProps) {
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
