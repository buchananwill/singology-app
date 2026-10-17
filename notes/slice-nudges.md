---
title: "Slice Nudge Emails: Fixed Design Decisions"
type: decision-spec
status: implemented
---

# Slice Nudge Emails

This document fixes the three alpha nudge emails (journal decision 43): feedback-ready to the student, new-submission to the coach, and a weekly practice reminder to a student who has not submitted this week. One scheduled Worker handler finds what is due, claims a row in the `notifications` sent-log, sends through a transport, and records the provider's id. Resend is the transport in production; a dry-run transport runs wherever the API key is absent, so the whole path is exercised in development and in the e2e suite before the founder's sending domain exists. It builds on `notes/slice-schema.md` decisions 38 to 40 and 55 (the sent-log and its unique indexes) and 61 (where `adminDb` may appear).

The document fixes the roster (§1) and the decisions (§2). Declarations are fixed; bodies belong to the implementer.

## 1. Type Roster

**`packages/shared` (`@singology/shared`), changed**

- `NOTIFICATION_KINDS` / `NotificationKind` — exist; unchanged.
- `EmailMessageSchema` (`{ to: z.email(), subject, text, html }`) and `EmailMessage` — new; what a transport sends.
- `NUDGE_CRONS` — new constant: `{ frequent: "*/5 * * * *", weekly: "0 9 * * 4" }`, the two schedules by name.

**`packages/db` (`@singology/db/admin`), new**

- `createNotificationQueue(adminDb)` returning `NotificationQueue`:

```ts
// AMENDED (pitfall 26): a union on kind, so each template receives exactly what it needs.
export interface Recipient {
  userId: string;
  email: string;
  displayName: string;
}
export interface FeedbackReadyDue { kind: "feedback_ready"; recipient: Recipient; coachFirstName: string; exerciseTitle: string; submissionId: string; feedbackId: string }
export interface NewSubmissionDue { kind: "new_submission"; recipient: Recipient; studentFirstName: string; exerciseTitle: string; submissionId: string }
export interface PracticeReminderDue { kind: "practice_reminder"; recipient: Recipient; waitingCount: number; periodStart: IsoDate }
export type DueNotification = FeedbackReadyDue | NewSubmissionDue | PracticeReminderDue;
export type ClaimedNotification = Pick<typeof notifications.$inferSelect, "id">;
export interface NotificationQueue {
  dueFeedbackReady(since: Date): Promise<FeedbackReadyDue[]>;
  dueNewSubmission(since: Date): Promise<NewSubmissionDue[]>;
  duePracticeReminders(periodStart: IsoDate): Promise<PracticeReminderDue[]>;
  claim(due: DueNotification): Promise<ClaimedNotification | null>; // null when already sent
  markSent(id: string, providerMessageId: string): Promise<void>;
  release(id: string): Promise<void>; // the send failed; the row goes, the next tick retries
}
// AMENDED (review): IsoDate = z.infer<typeof IsoDateSchema> (z.iso.date()) in packages/shared carries the YYYY-MM-DD format in the type.
```

**`apps/web/workers/notifications/`, new**

- `types.ts` — `NudgeEnv` and the transport config type, so `transport.ts` and `runNudges.ts` import downward only (*AMENDED, review*).
- `transport.ts` — `EmailTransport` (`send(message: EmailMessage, idempotencyKey: string): Promise<SentEmail>`, with `SentEmail` and the Resend response schema defined here, not in shared; *AMENDED, pitfall 27:* the claimed notification's id travels as the second argument, since the Resend header and the dry-run id both need it), `createResendTransport(apiKey, from)`, `createDryRunTransport()`.
- `templates.ts` — `feedbackReadyEmail(due, origin)`, `newSubmissionEmail(due, origin)`, `practiceReminderEmail(due, origin)`, each returning `EmailMessage`.
- `runNudges.ts` — `runNudges(env, cron, now): Promise<NudgeRunSummary>`; the handler body.
- `workers/app.ts` — gains `scheduled(controller, env, ctx)` calling `runNudges`.

**`apps/web` configuration**

- `wrangler.jsonc` — `triggers.crons` with the two schedules; `vars` gain `EMAIL_FROM` and `APP_ORIGIN`; the secret `RESEND_API_KEY` (wrangler secret in production, `.dev.vars` locally, absent in test and until the domain exists).

**Tests**

- `packages/db/test/db/notificationQueue.test.ts` — the due queries and the claim idempotence on the seeded test project.
- `apps/web/workers/notifications/templates.test.ts`, `runNudges.test.ts` — templates and the run loop against a fake queue and transport.
- `apps/web/e2e/nudges.spec.ts` — the scheduled route under `wrangler dev` with the dry-run transport.

## 2. Decisions

### One mechanism

1. **All three nudges are sent by one scheduled handler and nothing is sent inline from a route action**, because one code path with one idempotency rule is simpler than three, and a delay of up to five minutes is invisible for email.
2. **Two Cron Triggers:** `*/5 * * * *` runs the feedback-ready and new-submission passes; `0 9 * * 4` (Thursday 09:00 UTC) runs the practice-reminder pass; the handler branches on `controller.cron` against `NUDGE_CRONS`, and an unknown cron string logs and does nothing.
3. **Each pass is: query what is due, then for each row `claim`, `send`, `markSent`, with `release` on a failed send**, in that order; `claim` is the insert into `notifications` whose partial unique indexes make a second claim of the same thing return `null`, so a crashed tick, an overlapping tick or a redeploy can never send twice.
4. **A failed send deletes the claimed row (`release`) so the next tick retries**; a row with `provider_message_id` set is final; the handler never retries within a tick.
5. **The handler runs through `adminDb`** (schema decision 55: `notifications` has no `authenticated` policies), from `apps/web/workers/notifications/**`, which joins the ESLint allowlist for `@singology/db/admin` with the one-line why "the scheduled sender; no request, no user".
6. **`runNudges` returns a summary `{ cron, due, sent, skipped, failed }` and logs it as one line**, so a glance at the Worker logs shows each tick's outcome; it throws nothing out of the handler, because an exception would only make the platform retry what the claim already protects.

### What is due

7. **Feedback-ready:** every `feedback` row with `sent_at >= since` (the last 7 days) whose submission's student has no `notifications` row with `kind = 'feedback_ready'` and `entity_id = feedback.id`; recipient the student; link the student's submission page.
8. **New-submission:** every `submissions` row with `status = 'awaiting_review'` and `submitted_at >= since` (the last 7 days) whose enrolment's coach has no `notifications` row with `kind = 'new_submission'` and `entity_id = submission.id`; recipient the coach; link the review page.
9. **Practice reminder:** every student with an active enrolment and no submission with `submitted_at >= period_start`, where `period_start` is the Monday of the current ISO week (UTC), and no `notifications` row with `kind = 'practice_reminder'`, that `user_id` and that `period_start`; recipient the student; link the student home; the seven-day bound in 7 and 8 means a backlog older than a week is never emailed after an outage.
10. **Recipient addresses come from `auth.users.email` through `authUsers` from `drizzle-orm/supabase` under `adminDb`**, because `profiles` deliberately holds no email; the queue returns `email` and `displayName` together so the sender needs no second lookup. *AMENDED (review):* the queue excludes addresses on the seed's placeholder domain (`PLACEHOLDER_EMAIL_DOMAIN`, one constant shared with the seed), so the fixture cast never receives a real email once the Resend key is live.
11. **`since` and `periodStart` are computed by `runNudges` from the tick's `now`** (`controller.scheduledTime`) and passed in, so the queue has no clock and the integration tests pin time.

### Transport

12. **`createResendTransport(apiKey, from)` posts to `https://api.resend.com/emails` with `Authorization: Bearer <key>`, body `{ from, to, subject, text, html }`, and an `Idempotency-Key` header equal to the claimed notification's id**, and returns the response's `id`; a non-2xx response is a failed send (decision 4).
13. **`createDryRunTransport()` logs `to` and `subject` and returns `{ id: "dry-run:<notification id>" }`**; `runNudges` chooses it whenever `env.RESEND_API_KEY` is undefined or empty, so development, the e2e suite and the alpha before the domain exists all run the full path and leave `provider_message_id = 'dry-run:…'` rows that a later alpha reset clears.
14. **`EMAIL_FROM` is a var of the form `Singology <hello@<the founder's domain>>` and `APP_ORIGIN` is the deployed origin** (`https://singology-facade.resort-reference-gallery.workers.dev` until S7 renames); both are plain config, and links in every email are built from `APP_ORIGIN` only.

### Content

15. **Each email has a plain-text body and a minimal HTML body with the same words**, one short paragraph, one link, and the footer line "You're getting this because you're in the Singology alpha."; no images, no tracking, no unsubscribe mechanism in alpha (two testers who asked for these).
16. **Subjects:** feedback-ready "{Coach first name} has feedback on your {exercise title}"; new-submission "{Student first name} sent a take: {exercise title}"; practice reminder "A quick take this week?"; names through the existing `firstName` helper, titles from the library item.
17. **The link targets are** `/student/submissions/{id}` for feedback-ready, `/coach/reviews/{id}` for new-submission, and `/student` for the reminder; `href()` from React Router builds the paths so a route rename cannot silently break an email.

### Tests

18. **`notificationQueue.test.ts` on the seeded test project:** with `now` fixed, `dueFeedbackReady` returns the seeded feedback within seven days and nothing twice; `claim` of the same due item twice returns a row then `null`; `release` makes it claimable again; `duePracticeReminders` returns the seeded student with no take since Monday and omits one who has; each query asserts its zero case.
19. **`runNudges.test.ts` with a fake queue and a recording transport** proves the order claim-send-mark, that a transport failure calls `release` and counts `failed`, that an unknown cron sends nothing, and that the dry-run transport is chosen when the key is absent.
20. **`nudges.spec.ts` under `wrangler dev` against the test project:** `GET /cdn-cgi/local/scheduled?cron=*/5+*+*+*+*` returns 200, and a query through `@singology/db/admin` then finds `notifications` rows with `provider_message_id` starting `dry-run:` for the seeded due items; a second request adds no rows.

## 3. Deferred (explicitly out of scope)

- ~~**Resend custom SMTP for Supabase Auth's own emails**~~ *SUPERSEDED (journal D82, D83):* custom SMTP needs Pro; Supabase's Send Email Auth Hook calls `POST /api/auth/send-email` on the Worker, which sends the magic-link email through this transport. Built; enabled in the dashboard once the Resend key exists.
- **Per-user notification preferences and unsubscribe:** beta, with real students.
- **Web Push:** not in Day One (journal D43).
- **Digests and coach SLA warnings** ("a take has been waiting 48 hours"): beta.
- **Retry backoff and dead-lettering:** the five-minute tick and `release` are enough at alpha volume.

## 4. Retirement

- Nothing is removed; S6 adds the scheduled handler beside the existing `fetch` handler.
