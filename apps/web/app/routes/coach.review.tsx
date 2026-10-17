import type { Repositories } from "@singology/db";
import {
  firstName,
  formatCount,
  isUnplayableStatus,
  type LibraryItem,
  type MediaAsset,
  reviewActionSchemaFor,
  reviewModeOf,
  type Submission,
} from "@singology/shared";
import { data, type ShouldRevalidateFunctionArgs } from "react-router";

import type { PreviousTakeProps } from "../components/review/PreviousTake";
import { isFeedbackSent, type ReviewActionResult } from "../components/review/reviewFetchers";
import type { ReviewHeaderProps } from "../components/review/ReviewHeader";
import { ReviewWorkspace } from "../components/review/ReviewWorkspace";
import type { AssignableItem, TakeForReview } from "../components/review/types";
import { coachIdContext, repositoriesContext, requestTimeContext } from "../context";
import { parseInput, readJson } from "../lib/actionResult";
import { recordEventBestEffort } from "../lib/recordEvent";
import type { Route } from "./+types/coach.review";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  {
    title: loaderData
      ? `Review: ${loaderData.student.displayName}, ${loaderData.item.title} | Singology`
      : "Review | Singology",
  },
];

function toAssignable({ id, title, category }: LibraryItem): AssignableItem {
  return { id, title, category };
}

function takeForReview(
  submission: Submission,
  asset: MediaAsset | undefined,
): TakeForReview | undefined {
  if (asset) {
    return { playable: true, asset };
  }
  return isUnplayableStatus(submission.status)
    ? { playable: false, status: submission.status }
    : undefined;
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
  const [coach, student, item, asset] = await Promise.all([
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
  } satisfies ReviewHeaderProps;
  if (reviewModeOf(submission) === "reviewed") {
    const sent = await repositories.feedback.forSubmissionWithComments(submission.id);
    if (!asset || !sent) {
      throw data("Feedback not found", { status: 404 });
    }
    const assignments = await repositories.assignments.forFeedback(sent.feedback.id);
    const assigned = await repositories.library.getMany(assignments.map((a) => a.libraryItemId));
    return {
      ...header,
      mode: "reviewed" as const,
      take: asset,
      ...sent,
      assigned: assigned.map(toAssignable),
    };
  }
  const take = takeForReview(submission, asset);
  if (!take) {
    throw data("Submission media not found", { status: 404 });
  }
  const [previous, library] = await Promise.all([
    loadPreviousTake(repositories, submission.id),
    repositories.library.list(),
  ]);
  return {
    ...header,
    mode: "reviewing" as const,
    take,
    previous,
    library: library.map(toAssignable),
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
  // The database's unique constraint is the backstop.
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
  await recordEventBestEffort(repositories.events, {
    kind: "feedback_sent",
    entityId: sent.feedback.id,
    meta: {
      submissionId: submission.id,
      commentCount: sent.comments.length,
      assignedCount: input.assignLibraryItemIds.length,
    },
  });
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
}: ShouldRevalidateFunctionArgs): boolean {
  return isFeedbackSent(actionResult) ? false : defaultShouldRevalidate;
}

/** The student's previous take of the same exercise, with its media and any comments. */
async function loadPreviousTake(
  repositories: Repositories,
  submissionId: string,
): Promise<PreviousTakeProps | null> {
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
