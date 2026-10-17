import { Box, Button, Card, Grid, Stack, Text, Title } from "@mantine/core";
import type { Feedback, FeedbackComment, MediaAsset, Student } from "@singology/shared";
import { href, Link } from "react-router";

import { formatDate } from "../../lib/format";
import { CommentList } from "../player/CommentList";
import { StandalonePlayer } from "../player/StandalonePlayer";

export interface ReviewedViewProps {
  student: Student;
  take: MediaAsset;
  feedback: Feedback;
  /** In time order, so list numbers match the waveform markers. */
  comments: readonly FeedbackComment[];
}

/** The sent feedback, read-only: sent feedback is never edited. */
export function ReviewedView({ student, take, feedback, comments }: ReviewedViewProps) {
  return (
    <Grid gap="lg" data-testid="reviewed-view">
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Stack component="section" gap="sm" aria-labelledby="take-title" data-testid="review-take">
          <Title id="take-title" order={2} size="h3">
            The take
          </Title>
          <StandalonePlayer
            asset={take}
            comments={comments}
            label={`${student.displayName}'s take`}
          >
            <Title order={3} size="h4">
              Comments ({comments.length})
            </Title>
            {comments.length > 0 ? (
              <CommentList comments={comments} />
            ) : (
              <Text size="sm" c="dimmed">
                No timestamped comments on this take.
              </Text>
            )}
          </StandalonePlayer>
        </Stack>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 5 }}>
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
            <Box>
              <Button component={Link} to={href("/coach")} variant="light">
                Back to the queue
              </Button>
            </Box>
          </Stack>
        </Card>
      </Grid.Col>
    </Grid>
  );
}
