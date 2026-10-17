import { Card, Group, Text } from "@mantine/core";
import type { ReviewedQueueItem } from "@singology/db";

import { formatDate } from "../../lib/format";
import { QueueItemSummary } from "./QueueItemSummary";
import { ReviewLinkButton } from "./ReviewLinkButton";

export interface RecentlyReviewedCardProps {
  reviewed: ReviewedQueueItem;
}

export function RecentlyReviewedCard({ reviewed }: RecentlyReviewedCardProps) {
  const { submission, student, item, mediaKind, sentAt } = reviewed;
  return (
    <Card padding="md" data-testid="reviewed-item">
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <QueueItemSummary
          student={student}
          item={item}
          mediaKind={mediaKind}
          studentTestId="reviewed-student"
        >
          <Text size="sm" c="dimmed" data-testid="reviewed-sent">
            Sent {formatDate(sentAt)}
          </Text>
        </QueueItemSummary>
        <ReviewLinkButton
          submissionId={submission.id}
          label="Open"
          studentName={student.displayName}
          itemTitle={item.title}
        />
      </Group>
    </Card>
  );
}
