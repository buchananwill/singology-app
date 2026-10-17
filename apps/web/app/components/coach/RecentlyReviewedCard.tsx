import { Button, Card, Group, Stack, Text } from "@mantine/core";
import type { ReviewedQueueItem } from "@singology/db";
import { href, Link } from "react-router";

import { CATEGORY_LABEL, formatDate } from "../../lib/format";

interface RecentlyReviewedCardProps {
  reviewed: ReviewedQueueItem;
}

export function RecentlyReviewedCard({ reviewed }: RecentlyReviewedCardProps) {
  const { submission, student, item, sentAt } = reviewed;
  return (
    <Card padding="md" data-testid="reviewed-item">
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <Stack gap={0}>
          <Text fw={600} data-testid="reviewed-student">
            {student.displayName}
          </Text>
          <Text size="sm" c="dimmed">
            {item.title} · {CATEGORY_LABEL[item.category]}
          </Text>
          <Text size="sm" c="dimmed" data-testid="reviewed-sent">
            Sent {formatDate(sentAt)}
          </Text>
        </Stack>
        <Button
          component={Link}
          to={href("/coach/reviews/:submissionId", { submissionId: submission.id })}
          size="sm"
        >
          Open
        </Button>
      </Group>
    </Card>
  );
}
