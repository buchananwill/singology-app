---
title: "Slice Feedback Persistence: Fixed Design Decisions"
type: decision-spec
status: implemented
---

# Slice Feedback Persistence

This document fixes how the coach's review becomes real data: "Send feedback" persists the summary, the timestamped comments, the submission's `reviewed` status and the next assignments in one transaction through `feedback.send`; the student's feedback view, home and progress read what was sent; a reviewed submission opens read-only; and the pilot events for sending and viewing feedback are recorded. It builds on `notes/slice-schema.md` (decisions 26 to 37, 63 to 65) and `notes/slice-auth.md` (the signed-in `me`, the seeded cast, the test project). Media upload stays as the facade left it until Bunny is switched on (journal decision 49): this document says exactly what the two upload panels do meanwhile.

The document fixes the roster (§1) and the decisions (§2). Declarations are fixed; bodies belong to the implementer.

## 1. Type Roster

**`packages/shared` (`@singology/shared`), changed**

- `REVIEW_MODES` / `ReviewMode` (`"reviewing" | "reviewed"`) — new; which face the review workspace shows.
- `SendFeedbackSchema` — unchanged in shape; `reply` stays in the DTO and is ignored by persistence until S4.

**`packages/db` (`@singology/db`), one mapping change**

- `FeedbackRepository.send`, `EventRepository.record`, `SubmissionRepository.queueViewForCoach`, `previousFor` — used as they are.
- `toAssignment` and the fixture assignments — now carry `feedbackId` (*AMENDED, pitfall 24:* the column existed and nothing read it; `AssignmentSchema` gains `feedbackId?`).
- `AssignmentRepository.forFeedback(feedbackId)` — new on both implementations (*AMENDED, review:* "the exercises this feedback assigned" is a query, not a TypeScript filter repeated three times; this reverses journal D71's "no new method").

**`apps/web`, changed**

- `app/routes/coach.review.tsx` — the loader returns `mode` and, when reviewed, the sent feedback; the `send` action persists through `feedback.send` and records `feedback_sent`.
- `app/components/review/ReviewWorkspace.tsx` — renders `ReviewForm` (existing behaviour, `reviewing`) or `ReviewedView` (`reviewed`).
- `app/components/review/ReviewedView.tsx` — new; the sent feedback read-only: summary, comment markers and list on the player, assignments made, sent date.
- `app/components/review/SendFeedbackCard.tsx` — on success shows the sent state and a link back to the queue instead of the facade's demo toast copy.
- `app/routes/student.submission.tsx` — records `feedback_viewed` when the viewer is the student and feedback exists.
- `app/routes/auth.confirm.tsx` — records `signed_in` after a successful `verifyOtp`.
- `app/routes/student.exercise.tsx` action and the coach reply upload — honest interim copy (decisions 14 and 15).
- `e2e/review.spec.ts`, `e2e/smoke.spec.ts` — the persisted flow.

**Retired**

- The review action's "This is a demo, so nothing was saved." message and the `feedbackId: draft-feedback-…` fallback.

## 2. Decisions

### Sending

1. **The `send` intent of the review action calls `repositories.feedback.send({ ...input, submissionId })` and nothing else writes**, so the feedback row, its comments, the submission's `reviewed` status and one assignment per assigned exercise land in one transaction or not at all (schema decision 65).
2. **The action's input validation stays `reviewActionSchemaFor({ durationSec, libraryItemIds })`** from the take's duration and the active library, so a comment past the end of the take or an unknown exercise is refused before the transaction, with the existing messages.
3. **`replyMediaId` is never passed in S5**, because no media is persisted until S4; the `reply` field of the DTO is accepted and ignored, and decision 15 tells the coach so.
4. **After a successful send the action records `events.record({ kind: "feedback_sent", entityId: feedback.id, meta: { submissionId, commentCount, assignedCount } })`**, after the transaction and outside it, because a failed analytics insert must never undo a sent review.
5. **A second send on a reviewed submission is refused with 409 and the message "This take already has feedback."**, which the loader's `mode` already prevents in the UI and the `feedback.submission_id` unique constraint guarantees in the database; the action checks `mode` before calling `send` so the user sees the message rather than a constraint error.
6. **The action's success payload is `{ ok: true, message, feedbackId }`**, and the message reads "Feedback sent to {firstName}: {n comments}, {m new exercises}." with the existing `formatCount` pluralisation and no demo caveat.

### The two faces of the review workspace

7. **The loader returns `mode: ReviewMode`**, `"reviewed"` when `submission.status === "reviewed"` and `"reviewing"` otherwise; `processing` and `failed` submissions are not reachable from the queue and render as `reviewing` with the player absent and a status note ("still processing" for `processing`, "couldn't be processed, ask the student to upload again" for `failed`), which S4 exercises. *AMENDED (review):* after a successful send the page keeps its sent state rather than revalidating into `ReviewedView`; the next navigation shows `ReviewedView`.
8. **`ReviewWorkspace` keeps the route-to-component handoff (one spread of the loader data) and dispatches on `mode`** (*AMENDED, review:* its props are a header plus a union discriminated on `mode`, the lower-entropy form): `reviewing` renders the existing form (player with draft comments, add-comment, assign checklist, send card), `reviewed` renders `ReviewedView`; one component per file, the route module unchanged in role.
9. **`ReviewedView` shows the sent feedback read-only:** the take on the player with the persisted comments as markers and list, the summary, the exercises assigned by this feedback (by `assignments.feedback_id`), the sent date through the UTC helpers, and a link back to the queue; no add-comment, no checklist, no send.
10. **The send card's success state replaces the form in place** ("Sent" with the message and a "Back to the queue" link), so the coach is not shown an editable form for a review that is now immutable; the next navigation to the review shows `ReviewedView` from the loader.
11. **The review reducer stays page-local; its draft comments are `DraftComment = Omit<FeedbackComment, "feedbackId">`** (*AMENDED, review:* the sham `feedbackId` on drafts goes; `CommentList` and the player accept `Pick<FeedbackComment, "id" | "tSeconds" | "body">`), and the loader's `feedbackId` field and the `draft-feedback-…` fallback are deleted.

### Reading

12. **The student feedback view, home and progress change no query**; they already read `feedback.forSubmissionWithComments`, `feedback.forStudent`, `assignments.forStudent` and `submissions.forStudent`, which the Drizzle repositories serve from what `send` wrote, including the derived `feedback_ready` assignment status.
13. **`student.submission.tsx` records `events.record({ kind: "feedback_viewed", entityId: submission.id, meta: { feedbackId } })` in its loader when feedback exists**, every time, because the events table is append-only and "time to first view" is computed from the earliest row; the insert is awaited so a failed insert surfaces in development, and it runs after the page data is loaded.
14. **`auth.confirm.tsx` records `events.record({ kind: "signed_in" })` after a successful `verifyOtp`** with the new session's claims, so sign-ins exist in the pilot data from the first alpha day.

### Uploads until S4

15. **The student upload action keeps validating metadata and saving nothing, and its success message becomes "Your recording passed the checks. Uploads start saving in the next alpha release."**; the coach reply panel's success message becomes "Reply attached for this review only. Replies start saving in the next alpha release."; both strings live beside the actions, and S4 replaces them; nothing claims to have saved what was not saved.

### Tests

16. **`review.spec.ts` proves the persisted loop on the test project:** the founder signs in, reviews the CTO's awaiting take (`sub-ada-onset`), adds two comments, a summary and one assignment, sends; the queue shrinks by one; reopening the review shows `ReviewedView` with the two comments; then the CTO signs in and `/student/submissions/<uuid>` shows the summary, the two markers and the new exercise under "next", and `/student` shows the assignment as `feedback_ready`; a second POST of `send` to that submission returns 409.
17. **An integration test in `packages/db` already covers `feedback.send` rolling back whole**; S5 adds none to the data layer, and the route action gets a Vitest unit test only for its 409 branch (the rest is the e2e).
18. **The e2e suite stays deterministic because `global-setup` reseeds the test project** (auth spec decision 25); no test depends on another's writes.

## 3. Deferred (explicitly out of scope)

- **Editing or deleting sent feedback:** feedback is immutable in alpha (schema decision 52); a correction is a new message in beta.
- **Reply media and student uploads persisted:** S4.
- **Nudge emails on `feedback_sent` and new submissions:** S6, which reads the same events and tables.
- **Draft autosave for a half-written review:** page-local state is enough for two testers.

## 4. Retirement

- The demo caveats in `coach.review.tsx` ("This is a demo, so nothing was saved.") and the `draft-feedback-` id fallback are deleted.
- `apps/web/app/routes/coach.review.tsx` loses `feedbackId` from its loader data; the reducer is initialised with a page-local key instead.
