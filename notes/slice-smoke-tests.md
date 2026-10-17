---
title: "Singology Alpha: Smoke Tests"
type: spec
status: active
---

# Singology Alpha: Smoke Tests

Four scripts, one per core coaching function (journal decision 43), for the founder and the CTO to run by hand on the alpha. Each says what must be true before you start, the steps, what you should see, and what to write down if it goes wrong. Run them in order the first time; after that, any one on its own.

**Where:** `pnpm dev` at `http://localhost:5173` against the dev project today; the alpha deployment behind Cloudflare Access (journal D46) once the slice is deployed. **Until that deploy, the live workers.dev URL is still the September facade** and none of these scripts apply to it. **Accounts:** the founder's (`liveandletfunk@gmail.com`, coach) and the CTO's (`willwritescode@gmail.com`, student and coach). **Signing in:** the magic-link email for an address that receives mail, or the printed link: `pnpm -s --filter @singology/web sign-in-link <email> --origin <origin>`. **Reporting:** one line per problem in `notes/facade-pitfalls.md`'s format (what happened, what you expected, the page, the time), or tell the CTO.

## 0. Before any run

- The dev project is seeded (`pnpm --filter @singology/db seed:counts` shows users 5, submissions 7, feedback 4). If the data has drifted from earlier runs and you want a clean start, follow the reset procedure in `supabase/README.md`.
- Both accounts can sign in and land on the right home: the CTO on "This week", the founder on "Review queue".
- The header shows your name and role badges; "Sign out" works and returns you to the landing page.

## 1. Audio upload (runs when Bunny is switched on, S4)

**Today:** the upload panel validates the file and shows "Your recording passed the checks. Uploads start saving in the next alpha release." Nothing is stored. Check only that the panel reads the file's name, size and duration and plays it back.

**After S4**, as the CTO on a phone:
1. Open an exercise from "This week". Record a 20 to 60 second take in the phone's own recorder (iPhone: Voice Memos with Lossless on; Android: the built-in recorder). Pick it in "Upload your take", add a note, send.
2. **Expect:** a progress bar, then "Recording sent". Within about a minute, the take shows under "Your earlier takes" as "waiting for your coach". Reload: it is still there.
3. As the founder: the take is in the review queue with the student's name, exercise and note, and the waveform plays, seeks and loops.
4. **Write down:** the phone model and recorder, the file's size and length, how long "processing" took, and whether playback in the coach's browser sounded like the original.

## 2. Video upload (runs when Bunny is switched on, S4)

As the CTO on a phone, the same as script 1 with a 20 to 60 second video from the Camera app.
- **Expect:** the review workspace shows the video above the waveform; it plays in Chrome on the desktop and in Safari on the iPhone (the native HLS path, which no automated test proves: journal 1 pitfall 7). Scrubbing and comment-marker clicks land at the right time.
- **Write down:** the two browsers tried, whether the video played at all, whether seeking worked, and the time from upload to playable.

## 3. Feedback annotation (runs today)

As the founder:
1. Open "Review queue". **Expect:** the oldest take first, each with a time-left badge; nothing says overdue on a fresh seed.
2. Open Ben's "Sustained hiss". Play it. Pause at two places and use "Add comment at current time" each time, with a short comment. **Expect:** numbered markers on the waveform and a numbered list below it, in time order; clicking a marker or a list item seeks there.
3. Write a one-line summary. Tick one exercise under "Assign next exercises". Send.
4. **Expect:** "Feedback sent to Ben: 2 comments, 1 new exercise." The page is no longer editable. Back in the queue, Ben's take is gone. Open it again from "Recently reviewed" under the queue (Ben's take is at the top, with today's date): it opens read-only with your comments and the assigned exercise.
5. Repeat steps 2 to 4 on the CTO's "Balanced onsets on 'ah'" (a video take).
6. As the CTO: "This week" shows "Balanced onsets on 'ah'" as Feedback ready and the new exercise as To do. Open the feedback: the summary, the two markers and the comment list are there; clicking a comment seeks the take; "Next exercises" lists the one you assigned. "Progress" shows the take with its feedback; the A/B compare plays two sirens and switches at the same position.
7. Send feedback on the same take a second time by reloading the old review page and resubmitting if you can. **Expect:** refused with "This take already has feedback."
8. **Write down:** any marker that landed at the wrong time (say the time you paused at and the time the marker shows), any page where the comment numbering and the markers disagree, and anything you wanted to do and could not.

## 4. Nudge emails (dry-run today; real mail when Resend is wired)

Three emails exist: feedback-ready to the student, new-submission to the coach, and a Thursday practice reminder to a student with no take that week. A nudge is sent at most once per thing; a second run sends nothing.

**Today, dry-run (no mail leaves):**
1. Locally: with `pnpm dev` running, open `http://localhost:5173/cdn-cgi/local/scheduled?cron=*/5+*+*+*+*`. **Expect:** `200`, and one log line in the dev server like `nudges {"cron":"*/5 * * * *","due":N,"sent":N,"skipped":0,"failed":0}`, with a `dry-run` line per email naming the recipient and the subject. Open the URL again: `due:0`.
2. Deployed, **after the alpha deploy** (the Worker currently live is the September facade and has no scheduled handler, so `wrangler tail` shows nothing until the slice is deployed): `pnpm --filter @singology/web exec wrangler tail` and wait for the five-minute tick; the same summary line appears. The Thursday 09:00 UTC tick logs the reminders.
3. Check the sent-log: `notifications` rows with `provider_message_id` starting `dry-run:` (visible in the Supabase table editor, or through the `seed:counts` line's `notifications` count rising and then holding).

**After Resend is wired** (the CTO sets `RESEND_API_KEY` in `apps/web/.dev.vars` and restarts `pnpm dev`): a dry-run tick before the key existed has already claimed every nudge that was due, and claimed rows are final, so first run `pnpm --filter @singology/db sent-log --release-dry-runs` (it lists the log; the flag deletes the `dry-run:` rows) and tick again. Then run script 3 step 3 again on a fresh take; within five minutes the student's inbox has "{Coach} has feedback on your {exercise}" with a link that opens the feedback; upload a take (script 1) and the coach's inbox has "{Student} sent a take: {exercise}". Placeholder students never receive mail.
- **Write down:** which inbox each email reached, how long after the action, whether the link opened the right page signed in, and anything in the wording you would change.

## What is deliberately not in the alpha

Payments, in-page recording, native apps, push notifications, editing sent feedback, self-serve sign-up, profile editing, dark mode. If you reach for one of these, note it; it tells us where the simplicity line should sit.
