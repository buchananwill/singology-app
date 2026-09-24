---
title: "Singology Facade: Review Fix List"
type: spec
status: active
---

# Singology Facade: Review Fix List

This is the contract for the review-fix waves on branch `facade-review-fixes` (journal decision D37). It carries the findings of three reviewers that ran over `main..facade` on 2026-09-24: `singology-style-decomposition-reviewer` (IDs **S-B**n / **S-N**n), `react-quality-reviewer` (**R-B**n / **R-N**n) and `typescript-type-reviewer` (**T-B**n). Line numbers refer to the `facade` branch before any fix.

**Behaviour must not change.** The only exceptions are the two items marked *(visible)*, where the fix deliberately unifies inconsistent UI copy. After every wave: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` and `pnpm test:e2e` all pass. Screenshots and e2e assertions stay green except where an item marked *(visible)* changes the copy; update those assertions in the same commit.

## Shared primitives (create once; every later item uses them)

| Primitive | Home | Introduced by |
|---|---|---|
| `MINUTE_MS`, `HOUR_MS` | `packages/shared/src/constants.ts` | W3 (S-B4) |
| `groupBy(items, keyFn)` returning a `Map` | `packages/shared/src/groupBy.ts` (exported from the package entry) | W3 (S-B11, D35) |
| `ActionResult<T>` = `{ ok: true } & T \| { ok: false; error: string }` and `parseInput(schema, input, fallbackMessage)` | `apps/web/app/lib/actionResult.ts` | W1 (S-B7) |
| `formatCount(n, one, many)`, `firstName(displayName)`, `formatSince(iso, nowMs)`, `MEDIA_KIND_LABEL`, `ROLE_LABEL`, `COACH_TIER_COLOR`, `SLA_COLOR` | `apps/web/app/lib/format.ts` | W3 (S-B13, S-B14) |
| `StandalonePlayer` (wraps `PlayerProvider` + `WaveformPlayer`) | `apps/web/app/components/player/StandalonePlayer.tsx` | W2 (S-N5) |
| `useActionNotification(fetcher, successMessage)` | `apps/web/app/lib/useActionNotification.ts` | W2 (S-N3) |
| e2e helpers `mediaFixture(name)`, `currentTime(locator)`, `readyWaveforms(scope)` | `apps/web/e2e/helpers.ts` | W3 (S-B16) |

## Wave 0: tooling

1. **Prettier (D36).**
   - Add `prettier` and `eslint-config-prettier` at the root, a `.prettierrc.json` (defaults; set `"printWidth": 100` to match the prevailing layout) and a `.prettierignore` covering generated output (`build/`, `.react-router/`, `worker-configuration.d.ts`, `pnpm-lock.yaml`, `apps/web/public/media/`, `notes/`).
   - Add `format` and `format:check` scripts, and add `eslint-config-prettier` last in `eslint.config.js`.
   - **Commit the config, then commit the one-off `prettier --write .` as its own format-only commit.** No other changes in that commit.
2. **ES2023 (D35).** Set `lib` and `target` to `ES2023` in `tsconfig.base.json`. Nothing else changes yet.

## Wave 1: the data seam and actions

1. **S-B9 ownership.** Add `submissions.getForStudent(studentId, submissionId)` and `submissions.getForCoach(coachId, submissionId)` to `Repositories`. Each returns `{ submission, enrolment } | undefined`, and returns undefined when the owner doesn't match. Implement them in `createFixtureRepositories` (merge `enrolmentIdsForStudent` and `enrolmentIdsForCoach` there if natural; S-N8). Replace the checks in `student.submission.tsx:18-23` and the `coach.review.tsx:34-42` helper. The routes 404 on undefined. Add Vitest coverage for the wrong-owner case.
2. **S-B10 batch and view methods (trimmed list; add no others).**
   - `library.getMany(ids)` and `media.getMany(ids)` (order-preserving; missing ids omitted);
   - `feedback.forSubmissionWithComments(submissionId)`;
   - `submissions.queueViewForCoach(coachId)`, each item joined with student, library item, and media kind (replaces `coach.home.tsx:28-43`);
   - `coaches.listWithOffers()` (replaces `home.tsx:31-40`).
   Rewrite the loaders in `student.progress`, `coach.home`, `student.home`, `student.submission`, `coach.review` and `home` to use them. The four `.flatMap(x ? [x] : [])` filters go away. **No `await` inside a loop in any loader.**
3. **S-B7 action results.** Introduce `ActionResult<T>` and `parseInput` (see Shared primitives). Replace `UploadActionResult`, `SendFeedbackResult`, `ParsedRecordingUpload` and `ParsedSendFeedback`. `demo.tsx:24` returns an `ActionResult`. Parse forms with `Schema.safeParse(Object.fromEntries(formData))`, so the schema is the only list of field names. Move the duration and library-membership checks of `parseSendFeedback` into a `.superRefine` on a schema factory in `packages/shared`. Move `parseRecordingUpload.ts` and `sendFeedback.ts` out of `components/` into `apps/web/app/lib/actions/` or delete them if `parseInput` subsumes them.
4. **S-B8 one action form.** The review route's action accepts **one** encoding. Use `z.discriminatedUnion("intent", [ReplyUploadSchema, SendFeedbackSchema])` from `packages/shared`, parsed once at the top. Delete the 7-line JSDoc at `coach.review.tsx:88-95`.
5. **S-B2 one turnaround source.** `Coach.turnaroundHours` is the single source.
   - Drop the default parameter of `reviewSla` so every caller passes the coach's value.
   - `formatElapsed` takes its display threshold as an argument, or uses a named constant that isn't 72.
   - **(visible)** Show the turnaround in one unit on all three surfaces (`CoachCard.tsx:26`, `student.home.tsx:89`, `coach.home.tsx:57`): use **days** for whole days ("within 3 days"), via one formatter in `lib/format.ts`.
   - Delete `REVIEW_TURNAROUND_HOURS` if nothing else needs it.
6. **S-B3.** **(visible, wording only)** `home.tsx:121` and `:136` render the count from `monthly.submissionsPerPeriod`.

## Wave 1b: fix-cycle findings on Wave 1

Raised by the fix-cycle review of `cfc4eb5..356d201` (IDs **FC-B**n / **FC-N**n). Wave 1's own findings are all closed.

1. **FC-B1 dead repository methods.** Delete `coaches.list`, `coaches.offers`, `enrolments.get`, `submissions.get`, `submissions.queueForCoach` and `feedback.forSubmission` from `Repositories` and the fixture implementation. Keep `queueFor` and `commentsFor` as private fixture helpers. Rewrite the `fixtures.test.ts` cases (lines 264 to 425) against `queueViewForCoach`, `listWithOffers` and `forSubmissionWithComments`. **The interface carries only methods a production caller uses.**
2. **FC-B2.** Export `DemoRoleChoiceSchema = z.object({ role: DemoRoleSchema })` (with its error message) from `packages/shared`, and use it in `demo.tsx`. Remove the direct `zod` runtime dependency from `apps/web` if nothing else needs it at runtime.
3. **FC-B3.** Export `MessageResult = ActionResult<{ message: string }>` from `lib/actionResult.ts`, and use it in `UploadPanel`, `SendFeedbackCard` and `student.exercise.tsx`. Define `ReviewActionResult` as an intersection with it.
4. **FC-B4.** `sla.test.ts` uses `TURNAROUND_HOURS` in place of its five literal `72`s.
5. **FC-B5 comments.** Delete the restating JSDoc listed in the review: `repositories.ts` (`CoachWithOffers`, `OwnedSubmission`, `CoachQueueItem`, `queueViewForCoach`); `createFixtureRepositories.ts` (`EnrolmentOwner`, `pickByIds`); `schemas.ts` (`ReplyUploadSchema`, `sendFeedbackSchemaFor`, `reviewActionSchemaFor`, the `SendFeedbackLimits` field docs); `coach.review.tsx` (`feedbackSentMessage`); `home.tsx` (`formatMonthlyOffer`); `student.home.tsx` (`ThisWeekRow`); `UploadPanel.tsx` (`UploadPayload`); `actionResult.ts` (`ActionResult`); `format.ts` (`formatTurnaround`); `sendFeedback.test.ts` (`send`). Keep the ordering contract once, on `LibraryRepository.getMany`, and one sentence each on `FeedbackWithComments` ("in time order") and `parseInput` ("reports the schema's first issue").
6. **FC-N1.** Move the `RecordingUploadSchema` cases from `apps/web/app/lib/actionResult.test.ts` into a test beside the schema in `packages/shared`. `actionResult.test.ts` keeps only `parseInput`'s own contract.
7. **FC-N2 request encoding (journal D38).** Add `readJson(request)` to `lib/actionResult.ts` and use it in both JSON actions. Write the rule once, as a one-line module comment there: native `<Form>` posts form data (parsed with `Object.fromEntries`); fetcher submissions post JSON.
8. **FC-N4.** Add `indexById(items)` to `packages/shared` (next to Wave 3's `groupBy`), and use it in `student.home.tsx`, `student.progress.tsx` and `pickByIds`. `student.home` takes the same map-over-items shape as `student.progress`, and `ThisWeekRow` goes if it only existed to narrow.
9. **FC-N5.** `fixtures.test.ts:280-283` looks the coach up once and asserts it exists, with no `?? 0` fallback.

## Wave 2: player and components

1. **R-B1 `useWaveformInstance`.** Extract wavesurfer and RegionsPlugin construction, peaks fetching, region event wiring, the loop-boundary `timeupdate` listener and media-source attachment from `WaveformPlayer.tsx:116-213` into `apps/web/app/components/player/useWaveformInstance.ts`. It returns a small typed handle (ready, error, sourceMode, regions API). `WaveformPlayer.tsx` ends up under 150 lines. The create/destroy pairs stay together inside the hook.
2. **S-B1.** Delete `formatTime` in `WaveformPlayer.tsx:45-49` and use `formatTimestamp` from `lib/format.ts`.
3. **S-B15 theme tokens.**
   - Wavesurfer colours come from `useMantineTheme()` (brand for progress, `orange.8` for comments), resolved to values for the canvas. The `commentMarker` style block uses theme values.
   - Replace raw spacing (`UploadPanel.tsx:212`, `:246`; `home.tsx:63`; numeric gaps in `library.tsx`, `AssignChecklist.tsx` and `CommentList.tsx`) with tokens.
   - Replace the three `style={{ flexShrink: 0 }}` with a shared prop pattern or a Mantine prop.
   - Use Mantine `List listStyleType="none"` for the two unstyled `ol` stacks (`coach.home.tsx:64`, `CommentList.tsx:14`).
4. **S-N5 / R-N4 / T-B1 `StandalonePlayer`.** Replace the five inline `PlayerProvider` + `WaveformPlayer` wraps (`student.exercise.tsx:97`, `:115`, `student.submission.tsx:114`, `AbCompare.tsx:148`, `PreviousTake.tsx:39`) and `LabPlayer` in `lab.player.tsx`. Its props type is named and exported.
5. **R-N1 `useAbTransport`.** Extract the transport sync from `AbCompare.tsx:45-107` into a hook; the component keeps the markup.
6. **R-N2 `useUploadPanel`.** Extract the upload state machine from `UploadPanel.tsx` into a hook, plus a pure `buildUploadPayload` (*amended after Wave 1:* the panel posts JSON, so this builds the JSON payload, not `FormData`). The component keeps the markup.
7. **S-N3 `useActionNotification`.** Share the "idle fetcher result, notification, success alert" flow between `UploadPanel` and `SendFeedbackCard`, with a small `SuccessState` component.
8. **S-N4.** The review page's "Submitted N ago" uses `useNow`, like the queue.
9. **R-B2, R-B3, R-N3 props.** Name and export the props types for `CommentList`, `RoleNav`, `CoachCard`, `AppHeader`, `AbCompare` and `demo.tsx`'s `RoleCard`.
10. **R-B4.** Rename the generic `T` in `library.tsx` `FilterRow` and `FilterRowProps` to `FilterValue`.

## Wave 2b: fix-cycle findings on Waves 1b and 2

These come from the fix-cycle reviews of `354b449..31968d2`: style (**FC2-B**n / **FC2-N**n) and React (**FC2R-**…). Every Wave 1b and Wave 2 item is closed, except R-N2 and R-N3, which are only partly closed and are completed here.

1. **FC2-B1.** Delete the test-local `byId` in `packages/db/src/fixtures/fixtures.test.ts:33` and use `indexById` from `@singology/shared`.
2. **FC2-B2.** Put the error message on `DemoRoleSchema` itself. Define `DemoRoleChoiceSchema = z.object({ role: DemoRoleSchema })`. `demo.tsx` drops `PICK_A_VIEW` and passes a generic fallback (or imports one exported message constant).
3. **FC2-B3.** Move the JSDoc at `CommentList.tsx:8-12` and `RoleNav.tsx:36-37` back to the component functions, cut to their contracts: "Render inside the same `PlayerProvider`." and "Short labels so all fit in one row at 375px."
4. **FC2-B4.** Delete the doc on `SuccessState.tsx:8`. Cut `ReviewActionResult`'s doc to "A reply upload echoes its metadata back." Delete the duplicate comment at `useAbTransport.ts:33`.
5. **FC2-B5.** `coach.review.tsx:231-248` uses `StandalonePlayer`, with `AddComment`, the heading and the comment list as children. Reword `components/player/README.md:32` to "Use it wherever only its own children need the player's context."
6. **FC2-B6.** `sla.test.ts` writes derived values as `(TURNAROUND_HOURS - 26) * HOUR_MS` and `(TURNAROUND_HOURS + 8) * HOUR_MS`.
7. **FC2-B7.** In `fixtures.test.ts`, every missing-fixture guard uses `assert(x, "…")`, with no `?.`, `??` or `if` fallbacks (`:231-232`, `:244-245`, `:311-312`).
8. **FC2R-B1 (completes R-N2).** Extract the picked-file section of `UploadPanel.tsx` (name, size, duration, preview, note, progress, submit) into `PickedFilePanel`, and the recorder tips into their own small component. `UploadPanel.tsx` ends up under 150 lines.
9. **FC2R-N1 (completes R-N3).** Export `SubmittedAgoProps` and `ReviewWorkspaceProps` (`coach.review.tsx`) and `FilterRowProps` (`library.tsx`).
10. **FC2R-N2.** Move the pure `commentMarker` and `fetchPeaks` out of `useWaveformInstance.ts` into a sibling module (e.g. `waveformDom.ts`), leaving the hook to orchestrate.
11. **FC2-N1.** Add a small `PlainOrderedList` component (takes `spacing`) to replace `FULL_WIDTH_LIST_ITEMS` and the repeated `type="ordered" listStyleType="none"` props.
12. **FC2-N2.** `waveformTheme.ts` reads `theme.colors.brand` directly, with no silent fallback to blue.
13. **FC2-N3.** Style media elements consistently with props: `Box component="audio" w="100%"`, and `display` as a prop in `WaveformPlayer`. `aspectRatio` stays in `style`.
14. **FC2-N4.** The "lists coaches with their offers" test asserts against fixed offer ids and drops the redundant display-name assertion.

## Wave 3: consistency and hygiene

1. **S-B4.** Add `MINUTE_MS` and `HOUR_MS` to shared, and use them everywhere, tests included (`sla.ts:3`, `data.ts:37-38`, `sla.test.ts:5`, `format.ts:41`, `fixtures.test.ts:64`, `:322`, `format.test.ts:31`, `:40`).
2. **S-B5.** `ALL_VOICES = [...VOICE_TYPES]` in `data.ts:46`.
3. **S-B6.** Replace `copy()` in `createFixtureRepositories.ts:6` with `structuredClone`. Delete `copy` and its comment.
4. **S-B11 (under D35).** Use `toSorted` for copy-then-sort (`student.progress.tsx:22`, `student.home.tsx:45-46`, `reviewReducer.ts:36`, `:64`). Use the shared `groupBy` for `student.progress.tsx:21-32`. Use a named `latest…` helper instead of `.filter().sort()[0]` (`student.exercise.tsx:39-41`). The in-place sort and its comments at `student.progress.tsx:42-49` go. **Do not use `Map.groupBy` (D35).**
5. **S-B12 links.** Check whether React Router v8 exports a typegen-backed `href()`; check the docs or the `react-router` type definitions. If it does, use it for all route links and redirects (the 12 template literals, `RoleNav.tsx:16-31`, `demo.tsx:11-14`, `AppHeader.tsx`, `SendFeedbackCard.tsx:63`, `coach.review.tsx:205`, `library.tsx:39`, `:156`). Derive `HOME_FOR_ROLE` from the nav table. If it doesn't, stop and report.
6. **S-B13.** Move `SLA_COLOR` (`coach.home.tsx:12-16`) and `ROLE_LABEL` (`AppHeader.tsx:5-8`) into `lib/format.ts`. Add `COACH_TIER_COLOR` there (replaces the ternary at `CoachCard.tsx:19`). Add `MEDIA_KIND_LABEL` (replaces `coach.home.tsx:84` and `student.submission.tsx:112`).
7. **S-B14.** Add `formatCount`, `firstName` and `formatSince` (see Shared primitives), replacing `SendFeedbackCard.tsx:19-21`, `coach.review.tsx:143-147`, `library.tsx:122`, `student.home.tsx:63`, `coach.review.tsx:200`, `coach.home.tsx:106` and `coach.review.tsx:215`.
8. **S-B16 e2e helpers.** `player-lab.spec.ts` imports `trackErrors` from `./helpers`; delete its copy. Add `mediaFixture`, `currentTime` and `readyWaveforms`, and use them in all specs.
9. **S-B17 levelization.** Move the "file exists on disk" and "duration matches peaks" checks from `packages/db/src/fixtures/media.test.ts` and `fixtures.test.ts:28-31`, `:160-166` into an `apps/web` Vitest file. `packages/db` tests stop reading `apps/web/public`.
10. **S-B18 dead code.**
    - Use `LibraryFilterSchema` to parse `library.tsx`'s search params (map `voice` to `voiceType`; `.catch(undefined)` per field), or delete it.
    - Delete `RoleSchema`, `Role` and `ROLES` if unused.
    - Un-export `CLOCK_TICK_MS` and `peaksPathFor` if nothing imports them outside their module.
    - Remove `isbot` from `apps/web/package.json`.
    - Remove `postcss.config.cjs`, `postcss-preset-mantine` and `postcss-simple-vars` **only if** `pnpm build` and the e2e screenshots are unchanged without them. Mantine 9 may still need the preset for its own CSS; check its docs.
    - Remove the unused `~/*` path alias and fix the player README's import example.
11. **S-B19 comments.** Delete stale process narration, **all "spec decision N" and "D-number" citations in source** (they belong in commits and notes), and comments that restate names or types. Truncate multi-sentence docs to their one sentence of intent. Worked list: the S-B19 evidence in the review (`library.tsx:48`, `routes.ts:17`, `lab.player.tsx:11`, `useNow.ts:13-18`, `range.ts:2`, `serveMedia.ts:9-21`, `playerReducer.ts:32-46`, `constants.ts:1,10,16`, `parseRecordingUpload.ts:7`, `sendFeedback.ts:3,16`, `format.ts:30`, `ffmpeg.ts:43`, `demoRole.ts:8,26,31`, `CoachCard.tsx:8`, `AppHeader.tsx:15`, `DemoBanner.tsx:3`, `UploadPanel.tsx:36-41,55-61`, `AbCompare.tsx:12`, `reviewReducer.ts:13,19`, `SendFeedbackCard.tsx:23-27`, `WaveformPeaksSchema` in `schemas.ts:50-57`, `playwright.config.ts:20-23`). Keep, as one sentence each:
    - `serveMedia.ts`: "FACADE ONLY: buffers the whole asset; production media is served by the CDN."
    - `playwright.config.ts`: "`wrangler dev`, not `vite preview`: its proxy exhausts Windows ephemeral ports."
    - `WaveformPeaksSchema`: "`peaks` is `[maxima, minima]` per bin, passed straight to wavesurfer."
    - `useNow.ts`: "Never rounded: the first client value must not precede the server's."
12. **S-N6.**
    - Use one ffmpeg-argument style (flat lists) across `jobs/media`.
    - Merge `runFfmpeg` and `runFfmpegToBuffer` behind one options object.
    - Add one `clamp` helper in `jobs/media` for the three hand-written clamps.
13. **S-N7.**
    - Add one `HLS_MIME_TYPE` constant in `packages/shared`, used by `range.ts`, `attachMediaSource.ts` and the lab spec.
    - Define port `4173` once, e.g. `playwright.config.ts` reads it from a shared constant or env, and `vite.config.ts` uses the same.
    - Derive `peaksSrc` in `media.ts` from `src` via one helper.
14. **T-B2.** `e2e/helpers.ts:59` uses `DemoRole` from `@singology/shared`.

## Not taken

- **S-N8:** superseded by W1.1.
- **R-N6:** keep React Router's scaffolded `Layout` signature in `root.tsx`.
