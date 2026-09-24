import { Anchor, Badge, Card, Container, Grid, Group, Stack, Text, Title } from "@mantine/core";
import type {
  FeedbackComment,
  LibraryItem,
  MediaAsset,
  RecordingUpload,
  Student,
  Submission,
} from "@singology/shared";
import { useReducer } from "react";
import { href, Link, useFetcher } from "react-router";

import type { MessageResult } from "../../lib/actionResult";
import { CATEGORY_LABEL, firstName, formatDate } from "../../lib/format";
import { CommentList } from "../player/CommentList";
import { StandalonePlayer } from "../player/StandalonePlayer";
import { UploadPanel } from "../upload/UploadPanel";
import { AddComment } from "./AddComment";
import { type AssignableItem, AssignChecklist } from "./AssignChecklist";
import { PreviousTake, type PreviousTakeProps } from "./PreviousTake";
import { initialReviewState, reviewReducer } from "./reviewReducer";
import { SendFeedbackCard } from "./SendFeedbackCard";
import { SubmittedAgo } from "./SubmittedAgo";

/** A reply upload echoes its metadata back. */
export type ReviewActionResult = MessageResult & { upload?: RecordingUpload };

/** The fetcher key the reply's upload panel shares with the page, one per submission. */
function replyFetcherKey(submissionId: string): string {
  return `coach-reply-${submissionId}`;
}

export interface ReviewWorkspaceProps {
  now: number;
  turnaroundHours: number;
  submission: Submission;
  student: Student;
  item: LibraryItem;
  take: MediaAsset;
  feedbackId: string;
  comments: readonly FeedbackComment[];
  summary: string;
  previous: PreviousTakeProps | null;
  library: readonly AssignableItem[];
}

export function ReviewWorkspace({
  now,
  turnaroundHours,
  submission,
  student,
  item,
  take,
  feedbackId,
  comments,
  summary,
  previous,
  library,
}: ReviewWorkspaceProps) {
  const [review, dispatch] = useReducer(reviewReducer, null, () =>
    initialReviewState(feedbackId, comments, summary),
  );
  const replyFetcher = useFetcher<ReviewActionResult>({ key: replyFetcherKey(submission.id) });
  const reply = replyFetcher.data?.ok === true ? (replyFetcher.data.upload ?? null) : null;
  const studentFirstName = firstName(student.displayName);
  return (
    <Container size="lg">
      <Stack gap="lg">
        <div>
          <Anchor component={Link} to={href("/coach")} size="sm">
            ← Review queue
          </Anchor>
          <Title order={1}>Review: {student.displayName}</Title>
          <Group gap="xs">
            <Text c="dimmed">{item.title}</Text>
            <Badge variant="light">{CATEGORY_LABEL[item.category]}</Badge>
          </Group>
          <Text size="sm" c="dimmed">
            Submitted {formatDate(submission.submittedAt)} (
            <SubmittedAgo
              serverNow={now}
              submittedAt={submission.submittedAt}
              turnaroundHours={turnaroundHours}
            />
            )
          </Text>
        </div>

        <Grid gap="lg">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="md">
              {submission.note !== "" && (
                <Text data-testid="review-note">
                  <strong>{studentFirstName}'s note:</strong> {submission.note}
                </Text>
              )}
              <Stack
                component="section"
                gap="sm"
                aria-labelledby="take-title"
                data-testid="review-take"
              >
                <Title id="take-title" order={2} size="h3">
                  The take
                </Title>
                <StandalonePlayer
                  asset={take}
                  comments={review.comments}
                  label={`${student.displayName}'s take`}
                >
                  <AddComment draft={review.draft} dispatch={dispatch} />
                  <Title order={3} size="h4">
                    Comments ({review.comments.length})
                  </Title>
                  {review.comments.length > 0 ? (
                    <CommentList comments={review.comments} />
                  ) : (
                    <Text size="sm" c="dimmed">
                      No comments yet. Pause where you hear something and add one.
                    </Text>
                  )}
                </StandalonePlayer>
              </Stack>
              {previous !== null ? (
                <PreviousTake {...previous} />
              ) : (
                <Text size="sm" c="dimmed" data-testid="no-previous-take">
                  This is {studentFirstName}'s first take of this exercise.
                </Text>
              )}
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="md">
              <UploadPanel
                title="Reply (optional)"
                submitLabel="Attach reply"
                successTitle="Reply attached"
                fields={{ intent: "reply" }}
                fetcherKey={replyFetcherKey(submission.id)}
              />
              <Card withBorder padding="lg">
                <AssignChecklist
                  items={library}
                  value={review.assigned}
                  onChange={(libraryItemIds) => dispatch({ type: "setAssigned", libraryItemIds })}
                />
              </Card>
              <SendFeedbackCard
                review={review}
                dispatch={dispatch}
                reply={reply}
                studentFirstName={studentFirstName}
              />
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
