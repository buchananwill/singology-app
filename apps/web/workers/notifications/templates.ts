import type { DueNotification } from "@singology/db/admin";
import type { EmailMessage } from "@singology/shared";
import { href } from "react-router";

import { firstName } from "../../app/lib/format";

export const ALPHA_FOOTER = "You're getting this because you're in the Singology alpha.";

interface EmailContent {
  subject: string;
  paragraph: string;
  linkText: string;
  path: string;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

function compose(due: DueNotification, origin: string, content: EmailContent): EmailMessage {
  const url = new URL(content.path, origin).href;
  return {
    to: due.email,
    subject: content.subject,
    text: [content.paragraph, `${content.linkText}: ${url}`, ALPHA_FOOTER].join("\n\n"),
    html: [
      `<p>${escapeHtml(content.paragraph)}</p>`,
      `<p><a href="${escapeHtml(url)}">${escapeHtml(content.linkText)}</a></p>`,
      `<p>${escapeHtml(ALPHA_FOOTER)}</p>`,
    ].join("\n"),
  };
}

function aboutOf(due: DueNotification): NonNullable<DueNotification["about"]> {
  if (due.about === undefined) {
    throw new Error(`A ${due.kind} nudge names the other person and the exercise.`);
  }
  return due.about;
}

function submissionIdOf(due: DueNotification): string {
  if (!("submissionId" in due.link)) {
    throw new Error(`A ${due.kind} nudge links a submission.`);
  }
  return due.link.submissionId;
}

export function feedbackReadyEmail(due: DueNotification, origin: string): EmailMessage {
  const about = aboutOf(due);
  const coach = firstName(about.displayName);
  return compose(due, origin, {
    subject: `${coach} has feedback on your ${about.exerciseTitle}`,
    paragraph: `Hi ${firstName(due.displayName)}, ${coach} has listened to your take of ${about.exerciseTitle} and sent you feedback.`,
    linkText: "Read your feedback",
    path: href("/student/submissions/:id", { id: submissionIdOf(due) }),
  });
}

export function newSubmissionEmail(due: DueNotification, origin: string): EmailMessage {
  const about = aboutOf(due);
  const student = firstName(about.displayName);
  return compose(due, origin, {
    subject: `${student} sent a take: ${about.exerciseTitle}`,
    paragraph: `Hi ${firstName(due.displayName)}, ${student} has sent a new take of ${about.exerciseTitle} for you to review.`,
    linkText: "Review the take",
    path: href("/coach/reviews/:submissionId", { submissionId: submissionIdOf(due) }),
  });
}

function waitingExercises(due: DueNotification): string {
  const count = "exerciseIds" in due.link ? due.link.exerciseIds.length : 0;
  if (count === 0) {
    return "A few minutes on any exercise keeps your practice going.";
  }
  return count === 1
    ? "One exercise from your coach is waiting for a take."
    : `${count} exercises from your coach are waiting for a take.`;
}

export function practiceReminderEmail(due: DueNotification, origin: string): EmailMessage {
  return compose(due, origin, {
    subject: "A quick take this week?",
    paragraph: `Hi ${firstName(due.displayName)}, you haven't sent a take yet this week. ${waitingExercises(due)}`,
    linkText: "Choose an exercise",
    path: href("/student"),
  });
}
