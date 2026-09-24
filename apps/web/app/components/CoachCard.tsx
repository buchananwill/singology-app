import { Avatar, Badge, Card, Group, Stack, Text } from "@mantine/core";
import type { Coach } from "@singology/shared";

import { COACH_TIER_COLOR, COACH_TIER_LABEL, formatTurnaround } from "../lib/format";

export type CoachCardProps = Pick<
  Coach,
  "displayName" | "tier" | "bio" | "avatarSrc" | "turnaroundHours"
>;

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
            <Badge variant="light" color={COACH_TIER_COLOR[tier]}>
              {COACH_TIER_LABEL[tier]}
            </Badge>
          </div>
        </Group>
        <Text size="sm">{bio}</Text>
        <Text size="sm" c="dimmed">
          Feedback within {formatTurnaround(turnaroundHours)} of your upload.
        </Text>
      </Stack>
    </Card>
  );
}
