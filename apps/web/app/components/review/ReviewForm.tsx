import { Alert, Card, Stack, Text } from "@mantine/core";
import type { MediaAsset, Student, Submission } from "@singology/shared";

import { firstName, UNPLAYABLE_TAKE_MESSAGE, type UnplayableStatus } from "../../lib/format";
import { UploadPanel } from "../upload/UploadPanel";
import { AddComment } from "./AddComment";
import type { AssignableItem } from "./AssignableItemLabel";
import { AssignChecklist } from "./AssignChecklist";
import { PreviousTake, type PreviousTakeProps } from "./PreviousTake";
import { ReviewColumns } from "./ReviewColumns";
import { ReviewTake } from "./ReviewTake";
import { SendFeedbackCard } from "./SendFeedbackCard";
import type { ReviewSession } from "./useReviewSession";

export type TakeForReview =
  { playable: true; asset: MediaAsset } | { playable: false; status: UnplayableStatus };

/** What the loader sends for a review still being written. */
export interface ReviewFormData {
  submission: Submission;
  student: Student;
  take: TakeForReview;
  previous: PreviousTakeProps | null;
  library: readonly AssignableItem[];
}

export interface ReviewFormProps extends ReviewFormData {
  session: ReviewSession;
}

export function ReviewForm({
  submission,
  student,
  take,
  previous,
  library,
  session,
}: ReviewFormProps) {
  const { review, dispatch, sent, keys } = session;
  const studentFirstName = firstName(student.displayName);
  return (
    <ReviewColumns
      main={
        <Stack gap="md">
          {submission.note !== "" && (
            <Text data-testid="review-note">
              <strong>{studentFirstName}'s note:</strong> {submission.note}
            </Text>
          )}
          {take.playable ? (
            <ReviewTake
              take={take.asset}
              studentName={student.displayName}
              comments={review.comments}
              emptyText="No comments yet. Pause where you hear something and add one."
            >
              {!sent && <AddComment draft={review.draft} dispatch={dispatch} />}
            </ReviewTake>
          ) : (
            <Alert variant="light" data-testid="take-unplayable">
              {UNPLAYABLE_TAKE_MESSAGE[take.status]}
            </Alert>
          )}
          {previous !== null ? (
            <PreviousTake {...previous} />
          ) : (
            <Text size="sm" c="dimmed" data-testid="no-previous-take">
              This is {studentFirstName}'s first take of this exercise.
            </Text>
          )}
        </Stack>
      }
      side={
        <Stack gap="md">
          {!sent && (
            <UploadPanel
              title="Reply (optional)"
              submitLabel="Attach reply"
              successTitle="Reply attached"
              fields={{ intent: "reply" }}
              fetcherKey={keys.reply}
            />
          )}
          <Card withBorder padding="lg">
            <AssignChecklist
              items={library}
              value={review.assigned}
              onChange={(libraryItemIds) => dispatch({ type: "setAssigned", libraryItemIds })}
              disabled={sent}
            />
          </Card>
          <SendFeedbackCard session={session} studentFirstName={studentFirstName} />
        </Stack>
      }
    />
  );
}
