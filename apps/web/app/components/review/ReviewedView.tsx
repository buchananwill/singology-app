import { Box, Button, Card, Grid, List, Stack, Text, Title } from "@mantine/core";
import type { Feedback, FeedbackComment, MediaAsset, Student } from "@singology/shared";
import { href, Link } from "react-router";

import { CATEGORY_LABEL, formatDate } from "../../lib/format";
import { CommentList } from "../player/CommentList";
import { StandalonePlayer } from "../player/StandalonePlayer";
import type { AssignableItem } from "./AssignChecklist";

export interface ReviewedViewProps {
  student: Student;
  take: MediaAsset;
  feedback: Feedback;
  /** In time order, so list numbers match the waveform markers. */
  comments: readonly FeedbackComment[];
  /** The exercises this feedback assigned. */
  assigned: readonly AssignableItem[];
}

/** The sent feedback, read-only: sent feedback is never edited. */
export function ReviewedView({ student, take, feedback, comments, assigned }: ReviewedViewProps) {
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
            <Stack gap="xs" data-testid="sent-assigned">
              <Title order={3} size="h4">
                Exercises assigned ({assigned.length})
              </Title>
              {assigned.length > 0 ? (
                <List size="sm">
                  {assigned.map((item) => (
                    <List.Item key={item.id}>
                      {item.title} · {CATEGORY_LABEL[item.category]}
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
      </Grid.Col>
    </Grid>
  );
}
