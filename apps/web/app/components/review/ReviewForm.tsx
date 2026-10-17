import { Alert, Card, Grid, Stack, Text, Title } from "@mantine/core";
import type { MediaAsset, Student, Submission } from "@singology/shared";
import { useReducer } from "react";
import { useFetcher } from "react-router";

import { firstName } from "../../lib/format";
import { CommentList } from "../player/CommentList";
import { StandalonePlayer } from "../player/StandalonePlayer";
import { UploadPanel } from "../upload/UploadPanel";
import { AddComment } from "./AddComment";
import { type AssignableItem, AssignChecklist } from "./AssignChecklist";
import { PreviousTake, type PreviousTakeProps } from "./PreviousTake";
import { type ReviewActionResult, replyFetcherKey, sendFetcherKey } from "./reviewFetchers";
import { initialReviewState, reviewReducer } from "./reviewReducer";
import { SendFeedbackCard } from "./SendFeedbackCard";

export interface ReviewFormProps {
  submission: Submission;
  student: Student;
  /** `null` while the take is processing or after it failed. */
  take: MediaAsset | null;
  previous: PreviousTakeProps | null;
  library: readonly AssignableItem[];
}

/** Draft comments only key the page-local state; the server assigns the real ids. */
const DRAFT_FEEDBACK_KEY = "draft";

export function ReviewForm({ submission, student, take, previous, library }: ReviewFormProps) {
  const [review, dispatch] = useReducer(reviewReducer, null, () =>
    initialReviewState(DRAFT_FEEDBACK_KEY, []),
  );
  const replyFetcher = useFetcher<ReviewActionResult>({ key: replyFetcherKey(submission.id) });
  const reply = replyFetcher.data?.ok === true ? (replyFetcher.data.upload ?? null) : null;
  // Once sent the review is immutable, so nothing on the page stays editable.
  const sent = useFetcher<ReviewActionResult>({ key: sendFetcherKey(submission.id) }).data?.ok;
  const studentFirstName = firstName(student.displayName);
  return (
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
            {take === null ? (
              <Alert variant="light" data-testid="take-processing">
                This take is still processing, so there is nothing to play yet.
              </Alert>
            ) : (
              <StandalonePlayer
                asset={take}
                comments={review.comments}
                label={`${student.displayName}'s take`}
              >
                {sent !== true && <AddComment draft={review.draft} dispatch={dispatch} />}
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
            )}
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
          {sent !== true && (
            <UploadPanel
              title="Reply (optional)"
              submitLabel="Attach reply"
              successTitle="Reply attached"
              fields={{ intent: "reply" }}
              fetcherKey={replyFetcherKey(submission.id)}
            />
          )}
          <Card withBorder padding="lg">
            <AssignChecklist
              items={library}
              value={review.assigned}
              onChange={(libraryItemIds) => dispatch({ type: "setAssigned", libraryItemIds })}
              disabled={sent === true}
            />
          </Card>
          <SendFeedbackCard
            review={review}
            dispatch={dispatch}
            reply={reply}
            studentFirstName={studentFirstName}
            fetcherKey={sendFetcherKey(submission.id)}
          />
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
