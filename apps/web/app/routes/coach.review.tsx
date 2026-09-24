import type { Repositories } from "@singology/db";
import { reviewActionSchemaFor, type SendFeedback } from "@singology/shared";
import { data } from "react-router";

import { type ReviewActionResult, ReviewWorkspace } from "../components/review/ReviewWorkspace";
import { coachIdContext, repositoriesContext, requestTimeContext } from "../context";
import { parseInput, readJson } from "../lib/actionResult";
import { formatCount } from "../lib/format";
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
  const found = await repositories.submissions.getForCoach(
    context.get(coachIdContext),
    params.submissionId,
  );
  if (!found) {
    throw data("Submission not found", { status: 404 });
  }
  const { submission, enrolment } = found;
  const [coach, student, item, take, reviewed] = await Promise.all([
    repositories.coaches.get(enrolment.coachId),
    repositories.students.get(enrolment.studentId),
    repositories.library.get(submission.libraryItemId),
    repositories.media.get(submission.mediaId),
    repositories.feedback.forSubmissionWithComments(submission.id),
  ]);
  if (!coach || !student || !item || !take) {
    throw data("Submission data not found", { status: 404 });
  }
  const [previous, library] = await Promise.all([
    loadPreviousTake(repositories, submission.id),
    repositories.library.list(),
  ]);
  return {
    now: context.get(requestTimeContext).getTime(),
    turnaroundHours: coach.turnaroundHours,
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
      message: `"${input.fileName}" is attached. It goes to the student when you send your feedback.`,
      upload: input,
    });
  }
  return data<ReviewActionResult>({
    ok: true,
    message: feedbackSentMessage(student?.displayName ?? "The student", input),
  });
}

function feedbackSentMessage(
  studentName: string,
  { comments, reply, assignLibraryItemIds }: SendFeedback,
): string {
  const parts = [
    formatCount(comments.length, "comment", "comments"),
    reply ? "your reply" : null,
    assignLibraryItemIds.length > 0
      ? formatCount(assignLibraryItemIds.length, "new exercise", "new exercises")
      : null,
  ].filter((part) => part !== null);
  return `${studentName} gets ${parts.join(", ")}. This is a demo, so nothing was saved.`;
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
