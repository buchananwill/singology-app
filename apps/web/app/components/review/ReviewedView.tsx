import { Box, Button, Card, List, Stack, Text, Title } from "@mantine/core";
import type { FeedbackWithComments } from "@singology/db";
import type { MediaAsset, Student } from "@singology/shared";
import { href, Link } from "react-router";

import { formatDate } from "../../lib/format";
import { type AssignableItem, AssignableItemLabel } from "./AssignableItemLabel";
import { ReviewColumns } from "./ReviewColumns";
import { ReviewTake } from "./ReviewTake";

export type ReviewedViewProps = Readonly<FeedbackWithComments> & {
  student: Student;
  take: MediaAsset;
  assigned: readonly AssignableItem[];
};

export function ReviewedView({ student, take, feedback, comments, assigned }: ReviewedViewProps) {
  return (
    <ReviewColumns
      testId="reviewed-view"
      main={
        <ReviewTake
          take={take}
          studentName={student.displayName}
          comments={comments}
          emptyText="No timestamped comments on this take."
        />
      }
      side={
        <Card withBorder padding="lg" data-testid="sent-feedback">
          <Stack gap="md">
            <Title order={2} size="h3">
              Feedback sent
            </Title>
            <Text size="sm" c="dimmed" data-testid="sent-at">
              Sent {formatDate(feedback.sentAt)}
            </Text>
            {feedback.body !== "" ? (
              <Text data-testid="sent-summary">{feedback.body}</Text>
            ) : (
              <Text size="sm" c="dimmed">
                No summary with this review.
              </Text>
            )}
            <Stack gap="xs" data-testid="sent-assigned">
              <Title order={3} size="h4">
                Exercises assigned ({assigned.length})
              </Title>
              {assigned.length > 0 ? (
                <List size="sm">
                  {assigned.map((item) => (
                    <List.Item key={item.id}>
                      <AssignableItemLabel item={item} />
                    </List.Item>
                  ))}
                </List>
              ) : (
                <Text size="sm" c="dimmed">
                  No new exercises with this review.
                </Text>
              )}
            </Stack>
            <Box>
              <Button component={Link} to={href("/coach")} variant="light">
                Back to the queue
              </Button>
            </Box>
          </Stack>
        </Card>
      }
    />
  );
}
