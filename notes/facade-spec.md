---
title: "Singology Facade: Decision Spec"
type: spec
status: active
---

# Singology Facade: Decision Spec

**Intent.** Build a clickable, founder-facing facade of the Singology coaching platform. It runs on fixture data, with no real users, payments or media backend. It has two jobs. (1) Let the founder confirm that the CTO and he share the product vision. (2) Surface real technical pitfalls in the chosen stack before the vertical slice. The facade **is the real app** (journal decision D26): the same repo layout, routes and UI the slice will keep, with loaders reading fixtures through the repository interface the slice will implement with Drizzle.

Source decisions live in [gtm-journal-01.md](./gtm-journal-01.md): D14, D16, D17 to D26, D29. Product flows come from [05-product-landscape.md](./research/05-product-landscape.md) §MVP flows. Library facts come from [07-app-stack.md](./research/07-app-stack.md).

## Roster

| Unit | Location | Contents |
|---|---|---|
| Workspace root | `/` | `pnpm-workspace.yaml`, root `package.json` (`packageManager: pnpm@9.12.1`, `-r` scripts), `tsconfig.base.json`, ESLint config |
| Web app | `apps/web` | React Router v8 framework mode, SSR on Cloudflare Workers via `@cloudflare/vite-plugin`, Mantine 9, routes, components |
| Shared | `packages/shared` | Zod 4 schemas, inferred domain types, constants (tiers, roles) |
| Data | `packages/db` | The `Repositories` interface, plus `createFixtureRepositories()` and fixture data. Drizzle is **not** installed in the facade. |
| Media job prototype | `jobs/media` | Node/TypeScript scripts that generate the fixture media and compute waveform peaks with ffmpeg (the seed of the D21 Container job) |
| Fixture media | `apps/web/public/media` | Generated synthetic audio, video, HLS rendition and peaks JSON |
| Pitfalls log | `notes/facade-pitfalls.md` | Every delegate appends one entry per real problem hit |

**Domain types** (in `packages/shared`, mirroring the WP4 data model): `Coach`, `CoachOffer`, `Student`, `Enrolment`, `LibraryItem`, `Assignment`, `Submission`, `Feedback`, `FeedbackComment`, `MediaAsset` (`kind: 'audio' | 'video'`, `src`, `hlsSrc?`, `peaksSrc`, `durationSec`).

## Decisions

### Stack and tooling

1. **Versions are fixed:** React Router **v8** (framework mode, `ssr: true`), React 19.2.7+, Vite 7+, TypeScript 6 with `strict: true`, Mantine **9.x**, Zod **4.x**, wavesurfer.js **8.x**, hls.js (current), `@cloudflare/vite-plugin` plus wrangler 4.x.
2. **React Router v8 import rules:** import from `react-router` and `react-router/dom`. **`react-router-dom` does not exist in v8; never add it.** Do not use the removed `@react-router/dev/vite/cloudflare` proxy; deploy only through `@cloudflare/vite-plugin`. Route module `meta` uses `loaderData`, not `data`. Middleware is always on.
3. **No `any`,** and no `@ts-ignore` or `@ts-expect-error` without a written reason on the same line. Types flow from Zod schemas (`z.infer`) and React Router's generated route types.
4. **ESLint** includes `react-hooks` with `exhaustive-deps` set to **error** (D24).
5. **Root scripts:** `pnpm typecheck`, `pnpm lint`, `pnpm test` (Vitest), `pnpm build`, `pnpm dev`, and `pnpm preview` (runs the built Worker in the Workers runtime). All must pass before every commit that touches code.
6. **Nothing is deployed.** No `wrangler deploy`, no `wrangler login`, no Cloudflare account calls (D29).
7. **The generated `.react-router/` types folder and `.wrangler/` stay untracked** (already in `.gitignore`).

### Data seam

8. **`packages/db` exports a `Repositories` interface** with async methods only, e.g. `coaches.list()`, `coaches.get(id)`, `library.list(filter)`, `assignments.forStudent(studentId)`, `submissions.get(id)`, `submissions.queueForCoach(coachId)`, `feedback.forSubmission(id)`. Methods return `packages/shared` domain types.
9. **`createFixtureRepositories()`** implements that interface over in-module fixture data. The slice will add `createDrizzleRepositories(db)` behind the same interface. **Routes never import fixtures directly.**
10. **Routes get repositories from React Router's request context** (set in root middleware), never from module-level singletons.
11. **Mutations in the facade** (submit a recording, add a comment, send feedback) go through route `action`s that validate with Zod and return success without persisting. The UI shows the success state. After a reload, fixtures are unchanged. This is stated on the demo banner (decision 14).

### Surfaces

12. **Landing (`/`):** a hero with Singology's value in one line; "How it works" in three steps (practise with the library, record on your phone and upload, get timestamped feedback from your coach); coach cards (decision 16); a pricing table with the founder tier and standard tier, labelled "Illustrative pricing"; and a CTA "Try the demo" leading to `/demo`.
13. **Role switcher (`/demo`):** two cards, "View as a student" and "View as a coach (founder)". The choice is stored in a cookie. There is no authentication. The shell header shows the current role with a switch link.
14. **A demo banner** sits on every non-landing page: "Demo with sample data. Nothing you do here is saved."
15. **Student surfaces:**
    - `/student`: "This week": 2 to 4 assigned exercises with status (to do, submitted, feedback ready), the latest feedback card, and the coach's turnaround promise.
    - `/student/exercises/:id`: the exercise's demo media (video or audio), its backing-track player, written instructions, and the **upload panel** (decision 19).
    - `/student/submissions/:id`: feedback view. It shows the student's own recording on the waveform player with the coach's timestamped comments pinned as regions (clicking one seeks there), the coach's reply (audio or video), and the next assignments.
    - `/student/progress`: a timeline of past submissions per exercise, with a simple **A/B compare** of two takes of the same exercise (two players side by side, with one shared play control switching between them).
    - `/library`: the exercise library, filterable by category (breath, onset, range, agility) and voice type.
16. **Coach surfaces:**
    - `/coach`: the review queue, sorted oldest-first, with a per-item SLA countdown against a 72-hour turnaround, the student's name, exercise and note.
    - `/coach/reviews/:submissionId`: the **review workspace**: the waveform player (decision 20) with video above it when the submission is video; the student's note; the previous submission for the same exercise (collapsed); add-comment-at-current-time; a comment list; a reply upload (same panel as decision 19); an "Assign next exercises" checklist from the library; and "Send feedback", which submits the action and shows a success toast.
17. **Fixture cast:** 2 coaches ("Singology founder", premium tier; "Standard coach", standard tier), with placeholder avatars and short bios, **no real names**; 4 students with obviously fictional names; 8 library items; about 6 submissions across states, at least one with video; about 3 feedback items with 3 to 5 comments each.
18. **Layout is mobile-first.** Student surfaces must work at 375px width. The coach review workspace targets desktop and tablet, but must not break at 375px.

### Media

19. **Upload panel:** one `<input type="file" accept="audio/*,video/*">` **without** the `capture` attribute, so iOS offers Photos, Camera and Files. Under it goes a short "Recommended recorder" note: iPhone Voice Memos with Lossless on, or the Camera app; Android's built-in recorder. After a file is picked, show its name, size and duration (from a media element's `loadedmetadata`), play it back through a plain `<audio>` or `<video>` element (**no waveform decode of local files**), then Submit. Submitting runs a simulated upload progress bar, then the action (decision 11). Nothing leaves the browser.
20. **Waveform player component** (`apps/web/app/components/player/`), built once and used by the student feedback view, A/B compare and the coach workspace:
    - wavesurfer.js 8 attached to **our own** `<audio>` or `<video>` element (`media` option), rendering **pre-computed peaks** from `peaksSrc`. It never decodes the file.
    - Playback-rate control at 0.5x, 0.75x and 1x, with `preservesPitch = true` set on the media element.
    - A loop region (drag to create a loop, toggle loop on or off), using the Regions plugin.
    - Comment regions, rendered from `FeedbackComment[]`; clicking one seeks there.
    - Player state is a typed `useReducer` in a `PlayerProvider` (D24), with events `play`, `pause`, `seek`, `setRate`, `setLoop` and `mediaTime`. The wavesurfer and hls.js instances live in refs. **High-frequency time never goes into React state at more than 4 updates a second;** the waveform cursor is driven by wavesurfer itself.
    - The component must render during SSR without touching `window`; wavesurfer initialises in an effect.
21. **HLS path:** when a `MediaAsset` has `hlsSrc`, the player uses native HLS if `video.canPlayType('application/vnd.apple.mpegurl')` is truthy, else hls.js. At least one fixture video has an HLS rendition, so this path is exercised.
22. **Fixture media is synthetic.** It's generated by `jobs/media` scripts using the ffmpeg on PATH: a "student take" (a vocal-like tone scale with vibrato, 60 to 90 s), a "backing track", a "coach reply", and a 30 s 720p test-pattern video carrying the tone audio, plus an HLS rendition of that video. **No copyrighted or real recorded material, and no human voices.** Audio is AAC (`.m4a`) for cross-browser playback.
23. **Peaks script:** `jobs/media` has a TypeScript script that runs ffmpeg to decode any input to mono PCM, computes min/max peaks at a fixed resolution (e.g. 100 peaks per second), and writes wavesurfer-compatible JSON next to the media. This is the prototype of the D21 job. Generated media and peaks are committed (keep the total under 15 MB).

### Tests and verification

24. **Vitest:** fixture-repository tests (e.g. every `Submission` references an existing `Enrolment`, `LibraryItem` and `MediaAsset`), a Zod parse of all fixtures, and pure-function tests for the peaks computation.
25. **Playwright** (Chromium and WebKit): a smoke test that visits every route in decisions 12 to 16 against `pnpm preview`, asserts no console errors, and saves a screenshot per route at 1280px and 375px to `apps/web/test-results/screenshots/` (untracked).
26. **Proof of the Workers runtime:** the built app runs under `pnpm preview` (the Workers runtime, not only Vite dev) with SSR responses for every route.

### Process

27. **Many small, focused commits** on branch `facade`, one logical change each, and each passing decision 5's checks when it touches code. Every commit message ends with the two attribution lines from the lead's brief.
28. **Pitfalls log:** any problem that cost real time, forced a deviation from this spec, or will matter for the slice goes into `notes/facade-pitfalls.md` as one entry: **what happened, the workaround, whether it affects the slice or the founder demo, and the evidence** (error text or version). Wording is plain, for the CTO to reuse with the founder.
29. **Flag anything you had to interpret; never work around it.** If a decision here cannot be met as written, stop that part, log it in the pitfalls file, and report it to the lead.
