import type { FeedbackReadyDue, NewSubmissionDue, PracticeReminderDue } from "@singology/db/admin";
import { EmailMessageSchema } from "@singology/shared";
import { describe, expect, it } from "vitest";

import {
  ALPHA_FOOTER,
  feedbackReadyEmail,
  newSubmissionEmail,
  nudgeEmail,
  practiceReminderEmail,
} from "./templates";

const ORIGIN = "https://singology.example";

const ada = { userId: "student-1", email: "ada@example.com", displayName: "Ada Example" };
const sam = { userId: "coach-1", email: "sam@example.com", displayName: "Sam Coach" };

const feedbackReady: FeedbackReadyDue = {
  kind: "feedback_ready",
  recipient: ada,
  feedbackId: "feedback-1",
  submissionId: "submission-1",
  coachFirstName: "Sam",
  exerciseTitle: "Siren slides",
};

const newSubmission: NewSubmissionDue = {
  kind: "new_submission",
  recipient: sam,
  submissionId: "submission-1",
  studentFirstName: "Ada",
  exerciseTitle: "Siren slides",
};

const reminder = (waitingCount: number): PracticeReminderDue => ({
  kind: "practice_reminder",
  recipient: ada,
  periodStart: "2026-10-12",
  waitingCount,
});

const htmlWords = (html: string) => html.replace(/<[^>]+>/g, "").replaceAll("&#39;", "'");

describe("nudge templates", () => {
  it("tells the student their coach's feedback is ready, linking the submission", () => {
    const email = feedbackReadyEmail(feedbackReady, ORIGIN);
    expect(EmailMessageSchema.parse(email)).toEqual(email);
    expect(email.to).toBe("ada@example.com");
    expect(email.subject).toBe("Sam has feedback on your Siren slides");
    expect(email.text).toMatch(/^Hi Ada, Sam has listened/);
    expect(email.text).toContain(`${ORIGIN}/student/submissions/submission-1`);
    expect(email.html).toContain(`href="${ORIGIN}/student/submissions/submission-1"`);
  });

  it("tells the coach a student sent a take, linking the review", () => {
    const email = newSubmissionEmail(newSubmission, ORIGIN);
    expect(email.to).toBe("sam@example.com");
    expect(email.subject).toBe("Ada sent a take: Siren slides");
    expect(email.text).toMatch(/^Hi Sam, Ada has sent/);
    expect(email.text).toContain(`${ORIGIN}/coach/reviews/submission-1`);
    expect(email.html).toContain(`href="${ORIGIN}/coach/reviews/submission-1"`);
  });

  it("asks for a take this week, linking the student home and counting waiting exercises", () => {
    const none = practiceReminderEmail(reminder(0), ORIGIN);
    expect(none.subject).toBe("A quick take this week?");
    expect(none.text).toContain(`${ORIGIN}/student\n`);
    expect(none.text).toContain("A few minutes on any exercise");
    expect(practiceReminderEmail(reminder(1), ORIGIN).text).toContain(
      "1 exercise from your coach is waiting",
    );
    expect(practiceReminderEmail(reminder(2), ORIGIN).text).toContain(
      "2 exercises from your coach are waiting",
    );
  });

  it("renders each kind through its own template", () => {
    expect(nudgeEmail(feedbackReady, ORIGIN)).toEqual(feedbackReadyEmail(feedbackReady, ORIGIN));
    expect(nudgeEmail(newSubmission, ORIGIN)).toEqual(newSubmissionEmail(newSubmission, ORIGIN));
    expect(nudgeEmail(reminder(1), ORIGIN)).toEqual(practiceReminderEmail(reminder(1), ORIGIN));
  });

  it("gives every email the same words in text and HTML, with the alpha footer and one link", () => {
    const emails = [
      feedbackReadyEmail(feedbackReady, ORIGIN),
      newSubmissionEmail(newSubmission, ORIGIN),
      practiceReminderEmail(reminder(1), ORIGIN),
    ];
    for (const email of emails) {
      const [paragraph, link, footer] = email.text.split("\n\n");
      expect(footer).toBe(ALPHA_FOOTER);
      expect(email.html.match(/<a /g)).toHaveLength(1);
      const words = htmlWords(email.html);
      expect(words).toContain(paragraph);
      expect(words).toContain(link?.split(":")[0]);
      expect(words).toContain(ALPHA_FOOTER);
      expect(email.html).not.toMatch(/<img/);
    }
  });

  it("escapes names and titles in the HTML body", () => {
    const email = feedbackReadyEmail(
      { ...feedbackReady, exerciseTitle: "<b>Runs</b> & trills" },
      ORIGIN,
    );
    expect(email.html).toContain("&lt;b&gt;Runs&lt;/b&gt; &amp; trills");
    expect(email.text).toContain("<b>Runs</b> & trills");
  });
});
