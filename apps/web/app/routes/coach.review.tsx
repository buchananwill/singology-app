import { Anchor, Badge, Container, Grid, Group, Stack, Text, Title } from "@mantine/core";
import { useReducer } from "react";
import { data, Link } from "react-router";

import { CommentList } from "../components/player/CommentList";
import { PlayerProvider } from "../components/player/PlayerProvider";
import { WaveformPlayer } from "../components/player/WaveformPlayer";
import { AddComment } from "../components/review/AddComment";
import { initialReviewState, reviewReducer } from "../components/review/reviewReducer";
import { coachIdContext, repositoriesContext, requestTimeContext } from "../context";
import { CATEGORY_LABEL, formatDate, formatElapsed } from "../lib/format";
import type { Route } from "./+types/coach.review";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  {
    title: loaderData
      ? `Review: ${loaderData.student.displayName}, ${loaderData.item.title} | Singology`
      : "Review | Singology",
  },
];

export async function loader({ context, params }: Route.LoaderArgs) {
  const repositories = context.get(repositoriesContext);
  const coachId = context.get(coachIdContext);
  const submission = await repositories.submissions.get(params.submissionId);
  const enrolment = submission ? await repositories.enrolments.get(submission.enrolmentId) : undefined;
  // Only this coach's students; anything else is "not found", not "forbidden".
  if (!submission || enrolment?.coachId !== coachId) {
    throw data("Submission not found", { status: 404 });
  }
  const [student, item, take, feedback] = await Promise.all([
    repositories.students.get(enrolment.studentId),
    repositories.library.get(submission.libraryItemId),
    repositories.media.get(submission.mediaId),
    repositories.feedback.forSubmission(submission.id),
  ]);
  if (!student || !item || !take) {
    throw data("Submission data not found", { status: 404 });
  }
  return {
    now: context.get(requestTimeContext).getTime(),
    submission,
    student,
    item,
    take,
    /** New comments join the existing feedback, or a page-local draft. */
    feedbackId: feedback?.id ?? `draft-feedback-${submission.id}`,
    comments: feedback ? await repositories.feedback.comments(feedback.id) : [],
  };
}

export default function CoachReview({ loaderData }: Route.ComponentProps) {
  // A new submission gets fresh page-local review state.
  return <ReviewWorkspace key={loaderData.submission.id} {...loaderData} />;
}

type ReviewWorkspaceProps = Route.ComponentProps["loaderData"];

function ReviewWorkspace({
  now,
  submission,
  student,
  item,
  take,
  feedbackId,
  comments,
}: ReviewWorkspaceProps) {
  const [review, dispatch] = useReducer(reviewReducer, null, () =>
    initialReviewState(feedbackId, comments),
  );
  return (
    <Container size="lg">
      <Stack gap="lg">
        <div>
          <Anchor component={Link} to="/coach" size="sm">
            ← Review queue
          </Anchor>
          <Title order={1}>Review: {student.displayName}</Title>
          <Group gap="xs">
            <Text c="dimmed">{item.title}</Text>
            <Badge variant="light">{CATEGORY_LABEL[item.category]}</Badge>
          </Group>
          <Text size="sm" c="dimmed">
            Submitted {formatDate(submission.submittedAt)} (
            {formatElapsed(now - new Date(submission.submittedAt).getTime())})
          </Text>
        </div>

        <Grid gap="lg">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="md">
              {submission.note !== "" && (
                <Text data-testid="review-note">
                  <strong>{student.displayName.split(" ")[0]}'s note:</strong> {submission.note}
                </Text>
              )}
              <Stack component="section" gap="sm" aria-labelledby="take-title" data-testid="review-take">
                <Title id="take-title" order={2} size="h3">
                  The take
                </Title>
                <PlayerProvider>
                  <WaveformPlayer
                    asset={take}
                    comments={review.comments}
                    label={`${student.displayName}'s take`}
                  />
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
                </PlayerProvider>
              </Stack>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
