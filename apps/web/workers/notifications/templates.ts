import type {
  DueNotification,
  FeedbackReadyDue,
  NewSubmissionDue,
  PracticeReminderDue,
  Recipient,
} from "@singology/db/admin";
import { type EmailMessage, firstName, formatCount } from "@singology/shared";
import { href } from "react-router";

export const ALPHA_FOOTER = "You're getting this because you're in the Singology alpha.";

export interface EmailContent {
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

/** `paragraph` follows the greeting "Hi {first name}, ", so it starts in lower case. */
function compose(recipient: Recipient, origin: string, content: EmailContent): EmailMessage {
  const url = new URL(content.path, origin).href;
  const paragraph = `Hi ${firstName(recipient.displayName)}, ${content.paragraph}`;
  return {
    to: recipient.email,
    subject: content.subject,
    text: [paragraph, `${content.linkText}: ${url}`, ALPHA_FOOTER].join("\n\n"),
    html: [
      `<p>${escapeHtml(paragraph)}</p>`,
      `<p><a href="${escapeHtml(url)}">${escapeHtml(content.linkText)}</a></p>`,
      `<p>${escapeHtml(ALPHA_FOOTER)}</p>`,
    ].join("\n"),
  };
}

export function feedbackReadyEmail(due: FeedbackReadyDue, origin: string): EmailMessage {
  return compose(due.recipient, origin, {
    subject: `${due.coachFirstName} has feedback on your ${due.exerciseTitle}`,
    paragraph: `${due.coachFirstName} has listened to your take of ${due.exerciseTitle} and sent you feedback.`,
    linkText: "Read your feedback",
    path: href("/student/submissions/:id", { id: due.submissionId }),
  });
}

export function newSubmissionEmail(due: NewSubmissionDue, origin: string): EmailMessage {
  return compose(due.recipient, origin, {
    subject: `${due.studentFirstName} sent a take: ${due.exerciseTitle}`,
    paragraph: `${due.studentFirstName} has sent a new take of ${due.exerciseTitle} for you to review.`,
    linkText: "Review the take",
    path: href("/coach/reviews/:submissionId", { submissionId: due.submissionId }),
  });
}

function waitingExercises(waitingCount: number): string {
  if (waitingCount === 0) {
    return "A few minutes on any exercise keeps your practice going.";
  }
  return `${formatCount(waitingCount, "exercise from your coach is", "exercises from your coach are")} waiting for a take.`;
}

export function practiceReminderEmail(due: PracticeReminderDue, origin: string): EmailMessage {
  return compose(due.recipient, origin, {
    subject: "A quick take this week?",
    paragraph: `you haven't sent a take yet this week. ${waitingExercises(due.waitingCount)}`,
    linkText: "Choose an exercise",
    path: href("/student"),
  });
}

export function nudgeEmail(due: DueNotification, origin: string): EmailMessage {
  switch (due.kind) {
    case "feedback_ready":
      return feedbackReadyEmail(due, origin);
    case "new_submission":
      return newSubmissionEmail(due, origin);
    case "practice_reminder":
      return practiceReminderEmail(due, origin);
  }
}
