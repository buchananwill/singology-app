# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Singology: an asynchronous singing-coaching platform (exercise library, student self-recordings, timestamped coach feedback). The repo currently holds the **facade**: the real app running on fixture data, with no auth, persistence, payments or media backend. The founder has approved the GTM proposal and the facade. The current arc (the "slice") puts real cloud infrastructure behind the facade so the founder and CTO can alpha-test the designs. The fixtures are swapped for Drizzle over Postgres behind the same interfaces, so that swap should touch only `packages/db`.

Nothing is deployed from an agent session. Never run `wrangler deploy` or `wrangler login`; the user runs deploys.

## Current arc priorities

These are the founder's and CTO's standing priorities for the slice. Weigh every design choice against them.

- **Simplicity is the product.** The value proposition is helping singing students build good practice habits and vocal technique through the coaching feedback tools and the exercise library. Anything that impedes that is undesired complexity. Prefer the plainest design that does not compromise quality.
- **Stabilise the core database schema now.** Alpha permits throwaway migrations of any scale. Beta closes that gate: from then on migrations must be minimal and never destructive. Design the schema in alpha as if beta had already started.
- **Smoke-test every core coaching function end to end:** video upload, audio upload, feedback annotation, and nudge emails.
- **Day One is web only.** No native apps. Students record with an external app (phone voice recorder or camera) and upload the file to the page; do not build record-to-page capture. This is a deliberate choice for content quality.

## Commands

pnpm 9 workspace, Node 22+. Run from the repo root unless noted. On Windows open the shell at the correctly-cased path `D:\Coding\singology-app` (lower-case `coding` breaks pnpm filters, see pitfall 5).

| Task                     | Command                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Install                  | `pnpm install --frozen-lockfile`                                                                                                                                   |
| Typecheck all packages   | `pnpm typecheck`                                                                                                                                                   |
| Lint / format            | `pnpm lint`, `pnpm format` (`format:check` to verify)                                                                                                              |
| Unit tests, all packages | `pnpm test`                                                                                                                                                        |
| One unit test file       | `pnpm --filter @singology/web exec vitest run app/lib/format.test.ts` (same shape for `@singology/db`, `@singology/shared`, `@singology/media-jobs`)               |
| E2E (Chromium + WebKit)  | `pnpm test:e2e`                                                                                                                                                    |
| One e2e spec / browser   | `pnpm test:e2e e2e/review.spec.ts --project chromium`                                                                                                              |
| Dev server               | `pnpm dev`                                                                                                                                                         |
| Built Worker in workerd  | `pnpm preview` (port 4173)                                                                                                                                         |
| Build                    | `pnpm build`                                                                                                                                                       |
| Regenerate fixture media | `pnpm --filter @singology/media-jobs generate`, then `peaks` (needs ffmpeg on PATH)                                                                                |
| RLS tests (pgTAP)        | `pnpm --filter @singology/db test:rls`, and `test:rls -- --mutate` to prove each policy's test can fail                                                            |
| Repository integration   | `pnpm --filter @singology/db test:db`                                                                                                                              |
| Schema change            | edit `packages/db/src/schema`, `pnpm --filter @singology/db generate`, then `pnpm --filter @singology/db supabase db push`                                         |
| Seed the alpha database  | `pnpm --filter @singology/db seed` (idempotent), `seed:counts` to inspect                                                                                          |
| Sign in during alpha     | `pnpm -s --filter @singology/web sign-in-link <email> --origin http://localhost:5173` prints a one-line confirm URL to paste into the browser                      |
| Run the nudge sender     | with `pnpm dev` running, `GET http://localhost:5173/cdn-cgi/local/scheduled?cron=*/5+*+*+*+*` (`0+9+*+*+4` for the weekly reminder); one summary log line per tick |

Before any commit that touches code: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` must all pass. Run `pnpm test:e2e` when a route, component or Worker handler changed, and `test:rls` plus `test:db` when the schema, a policy, a repository or the seed changed. Two Supabase projects: `singology-dev` (the alpha humans use; `packages/db/.env`) and `singology-test` (the suites; `packages/db/.env.test`, selected by `SINGOLOGY_ENV=test`). `test:db`, `test:rls` and `test:e2e` default to the test project, and the e2e suite reseeds it before every run; never point them at dev. The database suites are excluded from the root `pnpm test`.

Things to know about the toolchain:

- `apps/web` typecheck runs `wrangler types` and `react-router typegen` before `tsc -b`. On a fresh clone the `./+types/*` route imports and `Env` do not resolve until `pnpm typecheck` has run once.
- **Secrets** live in `packages/db/.env` and `.env.test` (`DATABASE_URL`, the Supabase session-pooler string; `SUPABASE_SECRET_KEY`; and in `.env.test` also `SUPABASE_PUBLISHABLE_KEY`) and `apps/web/.dev.vars` (`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`, the dev pooler string). All are ignored. `pnpm dev` loads `.dev.vars` into the process environment and cannot start without it; the e2e server derives everything from `.env.test`. The db scripts let the env file override an inherited environment variable of the same name, and in test mode refuse to run if `.env.test` is missing. The Supabase project URL and publishable key for dev are plain `vars` in `wrangler.jsonc`. Never print or commit a value from any env file.
- **Migrations** are drizzle-kit output in `supabase/migrations`, applied with the Supabase CLI through `pnpm --filter @singology/db supabase` (it adds `--db-url`). Never `drizzle-kit push` or `migrate`. The custom migration (private schema, triggers, grants) is generated from the schema by `generate:private`, never hand-edited. The alpha reset procedure is in `supabase/README.md`.
- **Privileged database access** (`createAdminDb`, from `@singology/db/admin`) is allowed only inside `packages/db`, webhook routes and jobs; ESLint enforces it. Everything else goes through `createUserDb`, which runs every call inside one RLS transaction.
- E2E always rebuilds and starts the built Worker under `wrangler dev` (not `vite preview`, whose Node proxy exhausts Windows ephemeral ports). It needs port 4173 free. If a run was interrupted, kill the leftover `workerd.exe` and the `node.exe` whose command line contains `singology-app`, and nothing else: many unrelated `node.exe` processes run on this machine.
- Vitest in `apps/web` uses its own `vitest.config.ts` without the React Router and Cloudflare plugins; it covers `app/**`, `workers/**` and `test/**`.
- TypeScript is pinned to `~6.0.3` in every package because `typescript-eslint` does not support 7. Do not bump it.
- `.gitattributes` forces LF. `.gitignore` ignores `*.m4a` and friends except under `apps/web/public/media/**`.

## Architecture

### Package levels (strict, acyclic)

1. `packages/shared` (`@singology/shared`): Zod 4 schemas, the domain types inferred from them, constants (roles, tiers, categories), and pure functions (`groupBy`, `indexById`, SLA arithmetic). Imports no workspace package. Every domain type in the repo comes from `z.infer` here; never hand-write a parallel interface.
2. `packages/db` (`@singology/db`): the `Repositories` interface (`src/repositories.ts`) with two implementations, `createFixtureRepositories({ now })` over in-module fixture data (tests, the seed's source, `/lab/player`) and `createDrizzleRepositories(userDb, options)` over Postgres, one module per repository under `src/drizzle/` mirrored by `src/fixtures/repositories/`. The Drizzle schema in `src/schema/` is the single source of the database shape, with RLS policies declared beside each table and shared policy helpers in `src/schema/policies.ts`. All methods are async and return `@singology/shared` types. The row-to-domain mappers in `src/drizzle/mappers.ts` are the only place a database row becomes a domain type. The design decisions are in `notes/slice-schema.md`.
3. `apps/web` and `jobs/media`: applications. They import downward only and never each other. Always import a package through its public entry (`@singology/db`), never `@singology/db/src/...`.

### Request flow in `apps/web`

- `workers/app.ts` is the Worker entry. `/media/*` is routed to `workers/media/serveMedia.ts` **before** React Router and before the static-assets handler (`assets.run_worker_first` in `wrangler.jsonc`), because Workers static assets ignore HTTP Range and media cannot be seeked without `206` responses. Everything else goes to `createRequestHandler`.
- React Router v8 framework mode, `ssr: true`, routes declared in `app/routes.ts`. Route modules import their types from `./+types/<route>`.
- Root middleware (`app/root.tsx`) runs `sessionMiddleware`, `repositoriesMiddleware`, then `meMiddleware`. The session is Supabase Auth's, read through one `@supabase/ssr` client per request created in `sessionMiddleware` (`app/auth/supabase.server.ts`) and exposed on `supabaseContext`; the verified claims become `claimsContext`, which is the only input to `createUserDb`, so RLS sees exactly what the token said. `meMiddleware` loads the signed-in user's `profiles`, `students` and `coaches` rows into `meContext` (`null` for anon). Other request-scoped values in `app/context.ts`: `repositoriesContext`, `requestTimeContext` (the single `now` for the request), `studentIdContext`, `coachIdContext`.
- Roles are the presence of a `students` or `coaches` row; a user may hold both. Role gating is a layout route per role (`student.layout.tsx`, `coach.layout.tsx`, `anyRole.layout.tsx`) using the guard constants in `app/middleware/me.ts`: signed out redirects to `/sign-in`, a missing role is a 403. Pure role logic (`holdsRole`, `rolesOf`, `homeFor`, `ROLE_HOME`) lives in `app/lib/roles.ts`.
- Sign-in is magic link only and invite-only (`shouldCreateUser: false`): `/sign-in` posts the email, `/auth/confirm` verifies `token_hash` and sets the cookies, `/sign-out` is a POST. The `/auth/confirm` URL shape has one owner, `app/auth/confirmLink.ts`, shared with the e2e helper and the sign-in-link script. Magic-link emails are sent by Supabase's Send Email Auth Hook calling `POST /api/auth/send-email` (verified with standardwebhooks against `SEND_EMAIL_HOOK_SECRET`), which uses the same Resend transport as the nudges; until the hook and the Resend key are configured in the dashboard, everyone signs in through the printed link.
- Loaders read **only** through `context.get(repositoriesContext)`, which is `createDrizzleRepositories` over `createUserDb(env.HYPERDRIVE, claims)`. Missing data is `throw data("...", { status: 404 })`.
- Mutations are route `action`s that validate with a Zod schema from `@singology/shared` via `parseInput` in `app/lib/actionResult.ts` and return an `ActionResult`. Native `<Form>` posts form data; fetcher submissions post JSON read with `readJson`. Media upload actions still validate metadata only until Bunny is switched on.
- URL-representable UI state (filters, selection) lives in search params. Page-local state uses `useReducer`/`useState`; there is no global store.

### The waveform player

`app/components/player/` is the shared media player used by the student feedback view, the A/B compare and the coach review workspace. Read its `README.md` before touching it. Key invariants: wavesurfer.js 8 attaches to our own media element and draws pre-computed peaks from `asset.peaksSrc` (never decodes media); wavesurfer, Regions and hls.js are dynamically imported inside an effect so SSR never touches `window`; high-frequency media time never enters React state above 4 updates a second; one `WaveformPlayer` per `PlayerProvider`. `/lab/player` is its unlinked regression page.

### Nudge emails

`apps/web/workers/notifications/` is the scheduled sender: `scheduled()` in `workers/app.ts` runs `runNudges` on two Cron Triggers (`*/5 * * * *` for feedback-ready and new-submission, `0 9 * * 4` for the weekly practice reminder; a unit test keeps `wrangler.jsonc` in step with `NUDGE_CRONS`). The queue in `packages/db/src/notificationQueue.ts` runs on `adminDb`, and every send is claim, send, mark against the `notifications` table's unique indexes, so nothing sends twice. With no `RESEND_API_KEY` the dry-run transport logs the recipient and subject and records `dry-run:<id>`; placeholder seed addresses are never due. Recipient addresses come from `auth.users`, not `profiles`.

### Fixture media

`jobs/media` generates synthetic audio and a test-pattern video (plus an HLS rendition) with ffmpeg and writes wavesurfer-compatible peaks JSON (`WaveformPeaksSchema`). Output is committed under `apps/web/public/media/`. No real recordings or human voices, ever. `apps/web/test/fixtureFiles.test.ts` checks that every `MediaAsset` in the fixtures points at committed files with matching durations.

## House rules

The project's canonical style ruleset is the **`singology-style` skill** (`.claude/skills/singology-style/SKILL.md`). Load it before writing, changing or reviewing any code under `apps/`, `packages/`, `jobs/` or `supabase/`; every implementation brief says so and every reviewer loads it. It lives in a skill rather than here so that an agent working on one layer loads the rules on purpose instead of carrying all of them by default. The reviewer agent in `.claude/agents/singology-style-decomposition-reviewer.md` enforces them and is the detailed elaboration. The few rules below are the ones that bite before you have read the skill:

- React Router v8 imports come only from `react-router` and `react-router/dom`. `react-router-dom` does not exist here; never add it. Deploy only through `@cloudflare/vite-plugin`.
- No `any`. `@ts-ignore` / `@ts-expect-error` need a written reason on the same line. `consistent-type-imports` and `react-hooks/exhaustive-deps` are errors.
- Routes and components never import fixture data or construct a data client; data comes through the repositories on the router context.
- Comments are kept to intent the code cannot express. No JSDoc that restates a signature, no process narration, no pitfall or decision numbers in source.
- Prettier (`printWidth: 100`) owns layout. Never spend effort or review findings on formatting.

## Notes and process

`notes/` is the project's memory and is excluded from Prettier.

- `notes/facade-spec.md`: the numbered decision spec the facade was built to. Cite decisions by number.
- `notes/facade-pitfalls.md`: one entry per real problem (what happened, workaround, whether it affects the slice or the founder demo, evidence). Append an entry whenever something costs real time or forces a deviation from the spec. Read it before fighting Windows, WebKit, HLS or hydration issues; most have been hit already.
- `notes/gtm-journal-*.md`: the cross-session journal (decisions `D<n>`, findings `F<n>`). Follow its "Reading order for a fresh context"; do not read it end to end. The latest journal's "Next work" section is the current state.
- `notes/gtm-vision.md`, `gtm-plan.md`, `gtm-proposal.md`, `research/`: the product brief and GTM research. Read each brief's opening summary only, unless a decision cites a section.

If a spec decision cannot be met as written, stop that part, log it in the pitfalls file and report it. Do not work around it silently.
