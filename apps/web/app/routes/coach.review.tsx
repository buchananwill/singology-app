import type { Repositories } from "@singology/db";
import { reviewActionSchemaFor, type ReviewMode, type Submission } from "@singology/shared";
import { data, type ShouldRevalidateFunctionArgs } from "react-router";

import type { ReviewActionResult } from "../components/review/reviewFetchers";
import { ReviewWorkspace } from "../components/review/ReviewWorkspace";
import { coachIdContext, repositoriesContext, requestTimeContext } from "../context";
import { parseInput, readJson } from "../lib/actionResult";
import { firstName, formatCount } from "../lib/format";
import type { Route } from "./+types/coach.review";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  {
    title: loaderData
      ? `Review: ${loaderData.student.displayName}, ${loaderData.item.title} | Singology`
      : "Review | Singology",
  },
];

function reviewModeOf(submission: Submission): ReviewMode {
  return submission.status === "reviewed" ? "reviewed" : "reviewing";
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
  const [coach, student, item, take] = await Promise.all([
    repositories.coaches.get(enrolment.coachId),
    repositories.students.get(enrolment.studentId),
    repositories.library.get(submission.libraryItemId),
    repositories.media.get(submission.mediaId),
  ]);
  if (!coach || !student || !item) {
    throw data("Submission data not found", { status: 404 });
  }
  const header = {
    now: context.get(requestTimeContext).getTime(),
    turnaroundHours: coach.turnaroundHours,
    submission,
    student,
    item,
  };
  if (reviewModeOf(submission) === "reviewed") {
    const sent = await repositories.feedback.forSubmissionWithComments(submission.id);
    if (!take || !sent) {
      throw data("Feedback not found", { status: 404 });
    }
    return { ...header, mode: "reviewed" as const, take, ...sent };
  }
  // Only a processing or failed take has no playable media yet.
  if (!take && submission.status === "awaiting_review") {
    throw data("Submission media not found", { status: 404 });
  }
  const [previous, library] = await Promise.all([
    loadPreviousTake(repositories, submission.id),
    repositories.library.list(),
  ]);
  return {
    ...header,
    mode: "reviewing" as const,
    take: take ?? null,
    previous,
    library: library.map(({ id, title, category }) => ({ id, title, category })),
  };
}

export async function action({ context, params, request }: Route.ActionArgs) {
  const repositories = context.get(repositoriesContext);
  const found = await repositories.submissions.getForCoach(
    context.get(coachIdContext),
    params.submissionId,
  );
  if (!found) {
    return data<ReviewActionResult>({ ok: false, error: "Submission not found." }, { status: 404 });
  }
  const { submission, enrolment } = found;
  // Sent feedback is immutable; the database's unique constraint is the backstop.
  if (reviewModeOf(submission) === "reviewed") {
    return data<ReviewActionResult>(
      { ok: false, error: "This take already has feedback." },
      { status: 409 },
    );
  }
  const [take, library, student] = await Promise.all([
    repositories.media.get(submission.mediaId),
    repositories.library.list(),
    repositories.students.get(enrolment.studentId),
  ]);
  const parsed = parseInput(
    reviewActionSchemaFor({
      durationSec: take?.durationSec ?? 0,
      libraryItemIds: new Set(library.map((item) => item.id)),
    }),
    await readJson(request),
    "The request was not valid.",
  );
  if (!parsed.ok) {
    return data<ReviewActionResult>({ ok: false, error: parsed.error }, { status: 400 });
  }
  const input = parsed.data;
  if (input.intent === "reply") {
    return data<ReviewActionResult>({
      ok: true,
      message:
        "Reply attached for this review only. Replies start saving in the next alpha release.",
      upload: input,
    });
  }
  const sent = await repositories.feedback.send({ ...input, submissionId: submission.id });
  await repositories.events
    .record({
      kind: "feedback_sent",
      entityId: sent.feedback.id,
      meta: {
        submissionId: submission.id,
        commentCount: sent.comments.length,
        assignedCount: input.assignLibraryItemIds.length,
      },
    })
    // The review is sent whatever happens to its analytics row, so the coach is told it was.
    .catch((error: unknown) => console.error("feedback_sent event not recorded", error));
  const studentName = student ? firstName(student.displayName) : "the student";
  return data<ReviewActionResult>({
    ok: true,
    message: `Feedback sent to ${studentName}: ${formatCount(sent.comments.length, "comment", "comments")}, ${formatCount(input.assignLibraryItemIds.length, "new exercise", "new exercises")}.`,
    feedbackId: sent.feedback.id,
  });
}

// The send card shows the sent state in place; the next visit to the review loads the reviewed face.
export function shouldRevalidate({
  actionResult,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  const sentHere =
    typeof actionResult === "object" && actionResult !== null && "feedbackId" in actionResult;
  return sentHere ? false : defaultShouldRevalidate;
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
