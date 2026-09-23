import { Avatar, Badge, Card, Group, Stack, Text } from "@mantine/core";
import type { Coach } from "@singology/shared";

import { COACH_TIER_LABEL } from "../lib/format";

type CoachCardProps = Pick<Coach, "displayName" | "tier" | "bio" | "avatarSrc" | "turnaroundHours">;

/** A coach's placeholder avatar, name, tier, bio and turnaround promise. */
export function CoachCard({ displayName, tier, bio, avatarSrc, turnaroundHours }: CoachCardProps) {
  return (
    <Card withBorder padding="lg" h="100%">
      <Stack gap="sm">
        <Group wrap="nowrap">
          <Avatar src={avatarSrc} alt="" size="lg" />
          <div>
            <Text fw={600} data-testid="coach-name">
              {displayName}
            </Text>
            <Badge variant="light" color={tier === "premium" ? "brand" : "gray"}>
              {COACH_TIER_LABEL[tier]}
            </Badge>
          </div>
        </Group>
        <Text size="sm">{bio}</Text>
        <Text size="sm" c="dimmed">
          Feedback within {turnaroundHours / 24} days of your upload.
        </Text>
      </Stack>
    </Card>
  );
}
