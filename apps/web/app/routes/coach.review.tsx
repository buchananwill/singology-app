import { Anchor, Badge, Card, Container, Grid, Group, Stack, Text, Title } from "@mantine/core";
import type { OwnedSubmission, Repositories } from "@singology/db";
import {
  type RecordingUpload,
  RecordingUploadSchema,
  sendFeedbackSchemaFor,
} from "@singology/shared";
import { useReducer } from "react";
import { data, Link, useFetcher } from "react-router";

import { CommentList } from "../components/player/CommentList";
import { PlayerProvider } from "../components/player/PlayerProvider";
import { WaveformPlayer } from "../components/player/WaveformPlayer";
import { AddComment } from "../components/review/AddComment";
import { AssignChecklist } from "../components/review/AssignChecklist";
import { PreviousTake } from "../components/review/PreviousTake";
import { initialReviewState, reviewReducer } from "../components/review/reviewReducer";
import { SendFeedbackCard } from "../components/review/SendFeedbackCard";
import { UploadPanel } from "../components/upload/UploadPanel";
import { coachIdContext, repositoriesContext, requestTimeContext } from "../context";
import { type ActionResult, parseInput } from "../lib/actionResult";
import { CATEGORY_LABEL, formatDate, formatElapsed } from "../lib/format";
import type { Route } from "./+types/coach.review";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  {
    title: loaderData
      ? `Review: ${loaderData.student.displayName}, ${loaderData.item.title} | Singology`
      : "Review | Singology",
  },
];

/** What the review action returns: a reply upload echoes its metadata back. */
type ReviewActionResult = ActionResult<{ message: string; upload?: RecordingUpload }>;

/** The fetcher key the reply's upload panel shares with the page, one per submission. */
function replyFetcherKey(submissionId: string): string {
  return `coach-reply-${submissionId}`;
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const repositories = context.get(repositoriesContext);
  const found = await repositories.submissions.getForCoach(
    context.get(coachIdContext),
    params.submissionId,
  );
  if (!found) {
    throw data("Submission not found", { status: 404 });
  }
  const { submission, enrolment } = found;
  const [student, item, take, reviewed] = await Promise.all([
    repositories.students.get(enrolment.studentId),
    repositories.library.get(submission.libraryItemId),
    repositories.media.get(submission.mediaId),
    repositories.feedback.forSubmissionWithComments(submission.id),
  ]);
  if (!student || !item || !take) {
    throw data("Submission data not found", { status: 404 });
  }
  const [previous, library] = await Promise.all([
    loadPreviousTake(repositories, submission.id),
    repositories.library.list(),
  ]);
  return {
    now: context.get(requestTimeContext).getTime(),
    submission,
    student,
    item,
    take,
    /** New comments join the existing feedback, or a page-local draft. */
    feedbackId: reviewed?.feedback.id ?? `draft-feedback-${submission.id}`,
    comments: reviewed?.comments ?? [],
    summary: reviewed?.feedback.body ?? "",
    previous,
    library: library.map(({ id, title, category }) => ({ id, title, category })),
  };
}

/**
 * Two requests, neither of which saves anything (decision 11):
 * - "Send feedback" posts the whole review as JSON; it is validated with
 *   `SendFeedbackSchema` plus the take's length and the library.
 * - The reply upload (the shared upload panel, posting `intent=reply`)
 *   validates the reply's metadata and echoes it back, so the page can send
 *   it with the feedback.
 */
export async function action({ context, params, request }: Route.ActionArgs) {
  const repositories = context.get(repositoriesContext);
  const found = await repositories.submissions.getForCoach(
    context.get(coachIdContext),
    params.submissionId,
  );
  if (!found) {
    return data<ReviewActionResult>({ ok: false, error: "Submission not found." }, { status: 404 });
  }
  if (request.headers.get("Content-Type")?.startsWith("application/json")) {
    return sendFeedback(repositories, found, await request.json().catch(() => null));
  }
  const formData = await request.formData();
  if (formData.get("intent") !== "reply") {
    return data<ReviewActionResult>({ ok: false, error: "Unknown request." }, { status: 400 });
  }
  const parsed = parseInput(
    RecordingUploadSchema,
    Object.fromEntries(formData),
    "The upload details were not valid.",
  );
  if (!parsed.ok) {
    return data<ReviewActionResult>({ ok: false, error: parsed.error }, { status: 400 });
  }
  return data<ReviewActionResult>({
    ok: true,
    message: `"${parsed.data.fileName}" is attached. It goes to the student when you send your feedback.`,
    upload: parsed.data,
  });
}

async function sendFeedback(
  repositories: Repositories,
  { submission, enrolment }: OwnedSubmission,
  body: unknown,
) {
  const [take, library, student] = await Promise.all([
    repositories.media.get(submission.mediaId),
    repositories.library.list(),
    repositories.students.get(enrolment.studentId),
  ]);
  const schema = sendFeedbackSchemaFor({
    durationSec: take?.durationSec ?? 0,
    libraryItemIds: new Set(library.map((item) => item.id)),
  });
  const parsed = parseInput(schema, body, "The feedback was not valid.");
  if (!parsed.ok) {
    return data<ReviewActionResult>({ ok: false, error: parsed.error }, { status: 400 });
  }
  const { comments, reply, assignLibraryItemIds } = parsed.data;
  const parts = [
    `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`,
    reply ? "your reply" : null,
    assignLibraryItemIds.length > 0
      ? `${assignLibraryItemIds.length} new ${assignLibraryItemIds.length === 1 ? "exercise" : "exercises"}`
      : null,
  ].filter((part) => part !== null);
  return data<ReviewActionResult>({
    ok: true,
    message: `${student?.displayName ?? "The student"} gets ${parts.join(", ")}. This is a demo, so nothing was saved.`,
  });
}

/** The student's previous take of the same exercise, with its media and any comments. */
async function loadPreviousTake(repositories: Repositories, submissionId: string) {
  const previous = await repositories.submissions.previousFor(submissionId);
  if (!previous) {
    return null;
  }
  const [asset, reviewed] = await Promise.all([
    repositories.media.get(previous.mediaId),
    repositories.feedback.forSubmissionWithComments(previous.id),
  ]);
  if (!asset) {
    return null;
  }
  return {
    submittedAt: previous.submittedAt,
    note: previous.note,
    asset,
    comments: reviewed?.comments ?? [],
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
  summary,
  previous,
  library,
}: ReviewWorkspaceProps) {
  const [review, dispatch] = useReducer(reviewReducer, null, () =>
    initialReviewState(feedbackId, comments, summary),
  );
  const replyFetcher = useFetcher<ReviewActionResult>({ key: replyFetcherKey(submission.id) });
  const reply = replyFetcher.data?.ok === true ? (replyFetcher.data.upload ?? null) : null;
  const firstName = student.displayName.split(" ")[0] ?? student.displayName;
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
                  <strong>{firstName}'s note:</strong> {submission.note}
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
              {previous !== null ? (
                <PreviousTake {...previous} />
              ) : (
                <Text size="sm" c="dimmed" data-testid="no-previous-take">
                  This is {firstName}'s first take of this exercise.
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
                studentFirstName={firstName}
              />
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
