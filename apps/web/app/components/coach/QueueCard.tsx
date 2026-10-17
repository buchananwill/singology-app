import { Badge, Card, Group, Stack, Text } from "@mantine/core";
import type { CoachQueueItem } from "@singology/db";
import { reviewSla } from "@singology/shared";

import { formatSince, formatTimeLeft, SLA_COLOR } from "../../lib/format";
import { QueueItemSummary } from "./QueueItemSummary";
import { ReviewLinkButton } from "./ReviewLinkButton";

export interface QueueCardProps {
  queued: CoachQueueItem;
  now: number;
  turnaroundHours: number;
}

export function QueueCard({ queued, now, turnaroundHours }: QueueCardProps) {
  const { submission, student, item, mediaKind } = queued;
  const sla = reviewSla(submission.submittedAt, now, turnaroundHours);
  return (
    <Card padding="md" data-testid="queue-item" data-sla={sla.state}>
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
          <QueueItemSummary
            student={student}
            item={item}
            mediaKind={mediaKind}
            studentTestId="queue-student"
          />
          <Badge
            color={SLA_COLOR[sla.state]}
            variant="light"
            size="lg"
            tt="none"
            data-testid="queue-sla"
            flex="none"
          >
            {sla.state === "due_soon" && "Due soon: "}
            {formatTimeLeft(sla.remainingMs)}
          </Badge>
        </Group>
        {submission.note !== "" && (
          <Text size="sm" fs="italic" data-testid="queue-note">
            “{submission.note}”
          </Text>
        )}
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Text size="sm" c="dimmed" data-testid="queue-submitted">
            Submitted {formatSince(submission.submittedAt, now, turnaroundHours)}
          </Text>
          <ReviewLinkButton
            submissionId={submission.id}
            label="Review"
            studentName={student.displayName}
            itemTitle={item.title}
          />
        </Group>
      </Stack>
    </Card>
  );
}
