import { Avatar, Badge, Card, Stack, Text } from "@mantine/core";
import type { Coach } from "@singology/shared";

import { COACH_TIER_LABEL, formatTurnaround } from "../lib/format";

export type CoachCardProps = Pick<
  Coach,
  "displayName" | "tier" | "bio" | "avatarSrc" | "turnaroundHours"
>;

export function CoachCard({ displayName, tier, bio, avatarSrc, turnaroundHours }: CoachCardProps) {
  return (
    <Card padding="lg" h="100%">
      <Stack gap="sm" align="center" ta="center">
        <Avatar
          src={avatarSrc}
          name={displayName}
          alt=""
          size={120}
          color="gray"
          className="portrait"
        />
        <Text className="voice" data-testid="coach-name">
          {displayName}
        </Text>
        <Badge variant="light" color="olive">
          {COACH_TIER_LABEL[tier]}
        </Badge>
        <Text size="sm">{bio}</Text>
        <Text size="sm" c="dimmed">
          Feedback within {formatTurnaround(turnaroundHours)} of your upload.
        </Text>
      </Stack>
    </Card>
  );
}
