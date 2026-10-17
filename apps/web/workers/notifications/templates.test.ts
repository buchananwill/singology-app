import type { DueNotification } from "@singology/db/admin";
import { EmailMessageSchema } from "@singology/shared";
import { describe, expect, it } from "vitest";

import {
  ALPHA_FOOTER,
  feedbackReadyEmail,
  newSubmissionEmail,
  practiceReminderEmail,
} from "./templates";

const ORIGIN = "https://singology.example";

const feedbackReady: DueNotification = {
  kind: "feedback_ready",
  userId: "student-1",
  email: "ada@singology.test",
  entityId: "feedback-1",
  link: { submissionId: "submission-1" },
  displayName: "Ada Example",
  about: { displayName: "Sam Coach", exerciseTitle: "Siren slides" },
};

const newSubmission: DueNotification = {
  kind: "new_submission",
  userId: "coach-1",
  email: "sam@singology.test",
  entityId: "submission-1",
  link: { submissionId: "submission-1" },
  displayName: "Sam Coach",
  about: { displayName: "Ada Example", exerciseTitle: "Siren slides" },
};

const reminder = (exerciseIds: string[]): DueNotification => ({
  kind: "practice_reminder",
  userId: "student-1",
  email: "ada@singology.test",
  periodStart: "2026-10-12",
  link: { exerciseIds },
  displayName: "Ada Example",
});

const htmlWords = (html: string) => html.replace(/<[^>]+>/g, "").replaceAll("&#39;", "'");

describe("nudge templates", () => {
  it("tells the student their coach's feedback is ready, linking the submission", () => {
    const email = feedbackReadyEmail(feedbackReady, ORIGIN);
    expect(EmailMessageSchema.parse(email)).toEqual(email);
    expect(email.to).toBe("ada@singology.test");
    expect(email.subject).toBe("Sam has feedback on your Siren slides");
    expect(email.text).toContain(`${ORIGIN}/student/submissions/submission-1`);
    expect(email.html).toContain(`href="${ORIGIN}/student/submissions/submission-1"`);
  });

  it("tells the coach a student sent a take, linking the review", () => {
    const email = newSubmissionEmail(newSubmission, ORIGIN);
    expect(email.to).toBe("sam@singology.test");
    expect(email.subject).toBe("Ada sent a take: Siren slides");
    expect(email.text).toContain(`${ORIGIN}/coach/reviews/submission-1`);
    expect(email.html).toContain(`href="${ORIGIN}/coach/reviews/submission-1"`);
  });

  it("asks for a take this week, linking the student home and counting waiting exercises", () => {
    const none = practiceReminderEmail(reminder([]), ORIGIN);
    expect(none.subject).toBe("A quick take this week?");
    expect(none.text).toContain(`${ORIGIN}/student\n`);
    expect(none.text).toContain("A few minutes on any exercise");
    expect(practiceReminderEmail(reminder(["a"]), ORIGIN).text).toContain(
      "One exercise from your coach is waiting",
    );
    expect(practiceReminderEmail(reminder(["a", "b"]), ORIGIN).text).toContain(
      "2 exercises from your coach are waiting",
    );
  });

  it("gives every email the same words in text and HTML, with the alpha footer and one link", () => {
    const emails = [
      feedbackReadyEmail(feedbackReady, ORIGIN),
      newSubmissionEmail(newSubmission, ORIGIN),
      practiceReminderEmail(reminder(["a"]), ORIGIN),
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
      { ...feedbackReady, about: { displayName: "Sam", exerciseTitle: "<b>Runs</b> & trills" } },
      ORIGIN,
    );
    expect(email.html).toContain("&lt;b&gt;Runs&lt;/b&gt; &amp; trills");
    expect(email.text).toContain("<b>Runs</b> & trills");
  });

  it("refuses a feedback-ready nudge that does not name the coach and the exercise", () => {
    expect(() => feedbackReadyEmail({ ...feedbackReady, about: undefined }, ORIGIN)).toThrow();
  });
});
