---
title: "Singology Alpha: Copy"
type: spec
status: proposed
---

# Singology Alpha: Copy

Every string a person reads in the alpha, in one place, for a single editing pass. Edit the text after each `→`; leave it empty to keep the current line. A delegate applies the edits mechanically, string for string, and the e2e assertions follow. Strings that are data (coach bios, exercise instructions, the seeded names) are not here; they live in `packages/db/src/fixtures/data.ts` and change with a reseed.

**Voice** (from the design system's README): we and you; a coach by the name on their card; open to anyone, never "beginner" as a label for a person; plain words for technique; British English; sentence case; one exclamation mark per screen at most, never in errors; no emoji; errors kind and specific. Buttons and nav are uppercased by the theme, so write them in sentence case here.

## Landing page

- **Hero eyebrow:** For choir singers
  →
- **Hero title:** Personal singing feedback between choir rehearsals
  →
- **Hero lead:** Singology is for people who sing in community choirs and want to improve on their own voice. Practise a short exercise, record it on your phone, and a coach sends back comments pinned to the moments that matter.
  →
- **Hero aside (serif):** If you've never had a lesson, you're exactly who this is for.
  →
- **Hero button:** Sign in
  →
- **Section eyebrow:** Three steps *(delegate's placeholder)*
  →
- **Section title:** How it works
  →
- **Step 1 title:** Practise with the library
  →
- **Step 1 body:** Short exercises for breathing, clean starts to notes, range and agility. Each has a demonstration and a backing track, and your coach chooses which ones to work on each week.
  →
- **Step 2 title:** Record on your phone and upload
  →
- **Step 2 body:** Use the voice recorder or camera you already have. There's no special equipment and nothing to install. Sing the exercise, then upload the take.
  →
- **Step 3 title:** Get timestamped feedback
  →
- **Step 3 body:** Every take is heard start to finish, and each comment is pinned to the second it's about, so you hear exactly what your coach means. Then they set your next exercises.
  →
- **Section eyebrow:** Who you will work with *(delegate's placeholder)*
  →
- **Section title:** The coaches
  →
- **Coach card, turnaround line:** Feedback within 3 days of your upload.
  →
- **Coach tier badges:** Founder tier / Standard tier
  →
- **Section eyebrow:** Plans *(delegate's placeholder)*
  →
- **Section title:** Pricing
  →
- **Table headings:** Coach / Monthly plan / Single review
  →
- **Monthly cell:** £80 a month for 4 reviews
  →
- **Table caption:** Illustrative pricing. These figures show how plans could work and are not final.
  →
- **Below the table:** A monthly plan includes the number of reviews shown, every month. A single review is a way to try it once.
  →
- **Section eyebrow:** Private alpha *(delegate's placeholder)*
  →
- **Section title:** Already invited?
  →
- **Section body:** Singology is in a private alpha. If you have an invitation, sign in with your email address and we'll send you a link.
  →
- **Section button:** Sign in
  →

## Sign in

- **Browser title:** Sign in | Singology
  →
- **Page title:** Sign in
  →
- **Page description:** We'll email you a link that signs you in. No password needed.
  →
- **Field label:** Email
  →
- **Button:** Email me a sign-in link
  →
- **After submitting (always the same, whatever the address):** If that address is registered, a sign-in link is on its way.
  →
- **Expired or used link:** That sign-in link has expired or was already used. Ask for a new one below.
  →
- **Signed in but no profile:** This account isn't set up yet. Ask the Singology team.
  →
- **Form error:** The sign-in form was not valid. / Enter an email address.
  →

## Shell

- **Alpha banner (every page but the landing):** Alpha test with real data. Tell the CTO about anything odd.
  →
- **Header, signed out:** Sign in
  →
- **Header, signed in:** {display name} · Student / Coach badges · Sign out
  →
- **Nav, student:** This week / Progress / Library
  →
- **Nav, coach:** Queue / Library
  →
- **Role badges:** Student / Coach
  →
- **404:** Page not found / The requested page could not be found.
  →
- **403:** *(current copy is in `describeRouteError`; say what you want it to read)*
  →

## Student: This week

- **Browser title:** This week | Singology
  →
- **Page title:** This week
  →
- **Greeting:** Hello {first name}. {Coach} replies within {3 days} of your upload.
  →
- **Section:** Your exercises
  →
- **Card meta:** {Category} · set {date}
  →
- **Link under a reviewed card:** Read the feedback
  →
- **Status badges:** To do / Submitted / Feedback ready
  →
- **Section:** Latest feedback
  →
- **Card meta:** From {Coach} on {date} · {n} timestamped comments
  →
- **Button:** Listen with comments
  →

## Student: Exercise page

- **Section:** How to do it
  →
- **Section:** Demonstration
  →
- **Section:** Backing track
  →
- **Under Backing track:** Play this through a speaker while you record. Slow it down to practise.
  →
- **Upload panel title:** Upload your take
  →
- **File field label:** Choose a recording
  →
- **File field description:** An audio or video file from your phone or computer.
  →
- **Recorder tips heading:** Recommended recorder
  →
- **Recorder tips:** iPhone: Voice Memos with Lossless turned on, or the Camera app. / Android: the built-in voice recorder.
  →
- **Picked file:** File: / Size: / Length: (reading… / unknown)
  →
- **Unplayable file:** This file can't be played in the browser. Try a different recording.
  →
- **Note label:** Note for your coach (optional)
  →
- **Submit button:** Send to your coach
  →
- **Success title (interim, until uploads save):** Recording checked
  →
- **Success message (interim):** Your recording passed the checks. Uploads start saving in the next alpha release.
  →
- **Success button:** Upload another
  →
- **Section:** Your earlier takes
  →
- **Earlier take lines:** {date}: feedback ready / {date}: waiting for your coach
  →

## Student: Feedback view

- **Browser title:** Feedback: {exercise} | Singology
  →
- **Page title:** Your feedback / Waiting for feedback
  →
- **Subtitle:** Your take from {date}
  →
- **Your note:** Your note: {note}
  →
- **Player label:** Your recording
  →
- **Coach reply player label:** Coach's reply
  →
- **Next exercises section:** *(current heading in `student.submission.tsx`; say what it should read)*
  →

## Student: Progress

- **Page title:** Progress
  →
- **Description:** Every take you've sent, by exercise.
  →
- **A/B compare:** Take to hear / A: … / B: … / Play / Pause
  →

## Library

- **Page title:** Exercise library
  →
- **Description:** Short exercises for breath, onsets, range and agility.
  →
- **Filter groups:** Category / Voice type
  →
- **Category labels:** Breath / Onset / Range / Agility
  →
- **Difficulty labels:** Beginner / Improver / Intermediate / Advanced *(note the voice rule about "beginner")*
  →
- **Voice type labels:** Soprano / Mezzo / Alto / Tenor / Baritone / Bass
  →

## Coach: Review queue

- **Browser title:** Review queue | Singology
  →
- **Page title:** Review queue
  →
- **Description:** Oldest first. You promise feedback within {3 days} of each upload.
  →
- **Empty queue:** Nothing waiting for review. Well done.
  →
- **Item meta:** {Exercise} · {Category} · Audio/Video
  →
- **Submitted line:** Submitted {62 hours ago}
  →
- **Time-left badge:** Due soon: {9h 52m} left / {2d 3h} left / Overdue
  →
- **Button:** Review
  →

## Coach: Review workspace

- **Back link:** ← Review queue
  →
- **Page title:** Review: {student}
  →
- **Submitted line:** Submitted {date} ({62 hours ago})
  →
- **Student's note:** {First name}'s note: {note}
  →
- **Section:** The take
  →
- **Player label:** {Student}'s take
  →
- **Loop hint:** Drag across the waveform to mark a loop.
  →
- **Button:** Add comment at current time
  →
- **Comment draft placeholder and button:** *(in `AddComment.tsx`; say what they should read)*
  →
- **Comments heading:** Comments ({n})
  →
- **No comments yet:** No comments yet. Pause where you hear something and add one.
  →
- **Previous take:** Previous take: {date} / This is {first name}'s first take of this exercise.
  →
- **Processing / failed take:** This take is still processing, so there is nothing to play yet. / This take couldn't be processed. Ask the student to upload it again.
  →
- **Reply panel title:** Reply (optional)
  →
- **Reply submit:** Attach reply
  →
- **Reply success:** Reply attached / Reply attached for this review only. Replies start saving in the next alpha release.
  →
- **Assign section:** Assign next exercises
  →
- **Assign description:** Ticked exercises appear on the student's This week list.
  →
- **Send card title:** Send feedback
  →
- **Summary label:** Summary for {first name} (optional)
  →
- **Send summary line:** {2 comments} · no reply / reply attached · {1 exercise} to assign
  →
- **Send button:** Send feedback
  →
- **Sent title:** Sent
  →
- **Sent message:** Feedback sent to {first name}: {2 comments}, {1 new exercise}.
  →
- **Sent button:** Back to the queue
  →
- **Second send refused:** This take already has feedback.
  →
- **Validation:** Add a comment, a summary or a reply before sending. / A comment can't be empty. / A comment is past the end of the take. / Each exercise can be assigned once. / An assigned exercise is not in the library.
  →

## Coach: Reviewed take (read-only)

- **Side card title:** Feedback sent
  →
- **Sent line:** Sent {date}
  →
- **No summary:** No summary with this review.
  →
- **Assigned heading:** Exercises assigned ({n})
  →
- **None assigned:** No new exercises with this review.
  →
- **No comments:** No timestamped comments on this take.
  →

## Emails

- **Footer on every email:** You're getting this because you're in the Singology alpha.
  →
- **Greeting on nudges:** Hi {first name},
  →
- **Feedback ready, subject:** {Coach} has feedback on your {exercise}
  →
- **Feedback ready, body:** {Coach} has listened to your take of {exercise} and sent you feedback.
  →
- **Feedback ready, link:** Read your feedback
  →
- **New submission, subject:** {Student} sent a take: {exercise}
  →
- **New submission, body:** {Student} has sent a new take of {exercise} for you to review.
  →
- **New submission, link:** Review the take
  →
- **Practice reminder, subject:** A quick take this week?
  →
- **Practice reminder, body:** you haven't sent a take yet this week. {2 exercises from your coach are} waiting for a take. / A few minutes on any exercise keeps your practice going.
  →
- **Practice reminder, link:** Choose an exercise
  →
- **Magic link, subject:** Your Singology sign-in link
  →
- **Magic link, body:** Here's your link to sign in. It works once and expires soon.
  →
- **Magic link, link:** Sign in to Singology
  →
- **Sender name (EMAIL_FROM):** Singology <hello@…>
  →
