---
title: "Slice Auth and Sessions: Fixed Design Decisions"
type: decision-spec
status: proposed
---

# Slice Auth and Sessions

This document fixes how a real signed-in user replaces the facade's demo role: Supabase Auth magic links through `@supabase/ssr` in React Router v8 middleware, the user's roles read from their `students` and `coaches` rows, the swap of the app's data access from fixtures to the Drizzle repositories over Hyperdrive, the retirement of `/demo`, and how the e2e suite signs in and which database it uses. It builds on `notes/slice-schema.md` (the `Repositories` interface, `createUserDb`, the `Claims` shape, the seed) and on journal decisions 46 and 47 (Access stays on top; magic link only, invite-only).

The document fixes the roster (§1) and the decisions (§2). Declarations are fixed; bodies belong to the implementer.

## 1. Type Roster

**`packages/shared` (`@singology/shared`), changed**

- `ProfileSchema` (`{ id, displayName }`) and `Profile` — new; the signed-in user's own profile row.
- `MeSchema` (`{ profile: Profile, student: Student | null, coach: Coach | null }`) and `Me` — new; who is signed in and which roles they hold.
- `SignInSchema` (`{ email: z.email() }`) — new; the sign-in form's input.
- `UserRole` (`"student" | "coach"`) and `USER_ROLES` — renamed from `DemoRole` / `DEMO_ROLES`; the same two values, now meaning a role a user holds rather than a view a visitor picked.
- `DemoRoleSchema`, `DemoRoleChoiceSchema` — deleted.

**`packages/db` (`@singology/db`), changed**

- `MeRepository` with `get(): Promise<Me | null>` — new on `Repositories`; `null` when the claims are `anon` or the profile row is missing.
- `fixtureUuid(fixtureId)` — now exported from the package root (it is pure); `/lab/player` and the e2e suite use it to address seeded rows.
- `magicLinkTokenFor(email): Promise<string>` — new, exported from `@singology/db/admin`; wraps `auth.admin.generateLink({ type: "magiclink" })` and returns `hashed_token`. Test and seed use only.
- `seedAlpha` — extended: seeds the whole fixture cast as users and loads the fixture coaching data (enrolments, assignments, submissions, feedback, comments) against them, after clearing the coaching tables.
- `src/env.ts` — gains environment selection: `SINGOLOGY_ENV=test` loads `packages/db/.env.test` instead of `.env`.

**`apps/web`, new**

- `app/auth/supabase.server.ts` — `createSupabaseServerClient(request): { client, headers }`: the `@supabase/ssr` server client bound to the request's cookies and the headers bag the caller returns (*AMENDED, review:* returned together, one form at four call sites).
- `app/auth/confirmLink.ts` — `confirmHref(tokenHash)` and the confirm-params schema; the one spelling of the `/auth/confirm` URL shape, used by the route, the e2e helper and the sign-in-link script.
- `app/lib/roles.ts` — `holdsRole(me, role)`, `rolesOf(me)`, `homeFor(me)`: pure role logic (*AMENDED, review:* moved out of the shell components).
- `app/middleware/session.ts` — `sessionMiddleware`: reads the session claims, sets `claimsContext`, copies any refreshed-cookie headers onto the response.
- `app/middleware/me.ts` — `meMiddleware`: sets `meContext` from `repositories.me.get()`; `requireSignedIn`, `requireStudent`, `requireCoach` guard constants (*AMENDED, review:* constants, not zero-argument factories; one private `requireRole(role)` behind the two role guards) that also set `studentIdContext` / `coachIdContext`.
- `app/routes/sign-in.tsx` — the email form and its action (`signInWithOtp`).
- `app/routes/auth.confirm.tsx` — the magic-link landing: `verifyOtp` with `token_hash`, then redirect.
- `app/routes/sign-out.tsx` — action only: `signOut`, redirect to `/`.
- `app/components/shell/AlphaBanner.tsx` — replaces `DemoBanner`.
- `e2e/auth.ts` — `signInAs(page, who)`: the test sign-in helper.
- `e2e/global-setup.ts` — reseeds the test database before the suite.

**`apps/web`, changed**

- `app/context.ts` — `demoRoleContext` deleted; `claimsContext: Claims` and `meContext: Me | null` added; `studentIdContext`, `coachIdContext`, `repositoriesContext`, `requestTimeContext` unchanged.
- `app/middleware/repositories.ts` — builds `createDrizzleRepositories(createUserDb(env.HYPERDRIVE, claims), { now })`.
- `app/root.tsx` — middleware order `[sessionMiddleware, repositoriesMiddleware, meMiddleware]`; loader returns `me`.
- `app/components/shell/AppHeader.tsx`, `RoleNav.tsx`, `navItems.ts` — take `Me`, not a role.
- `app/routes/{student,coach,anyRole}.layout.tsx` — use the new guards.
- `app/routes/library.tsx`, `home.tsx`, `lab.player.tsx` — `me`-aware links; seeded ids.
- `wrangler.jsonc` — `vars` gain `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (public values).
- `playwright.config.ts`, `package.json` scripts — the e2e server runs against the test database.

**Retired**

- `app/routes/demo.tsx`, `app/components/demo/RoleCard.tsx`, `app/demo/roleCookie.server.ts`, `app/middleware/demoRole.ts`, `app/components/shell/DemoBanner.tsx`, `DEMO_STUDENT_ID`, `DEMO_COACH_ID`, `DEMO_ROLES`, the `/demo` route entry, and the e2e `chooseRole` helper.

## 2. Decisions

### Session

1. **The session is Supabase Auth's, carried in its own cookies by `@supabase/ssr`**, read on every request by `sessionMiddleware` in root middleware; no cookie of ours holds identity, so the demo role cookie has no successor.
2. **`createSupabaseServerClient(request, responseHeaders)` builds `createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { cookies: { getAll, setAll } })`** with `getAll` parsing the request's `Cookie` header and `setAll` appending `Set-Cookie` lines to the headers bag, because that is Supabase's documented React Router pattern and it keeps the client stateless per request.
3. **`sessionMiddleware` calls `getClaims()` once, sets `claimsContext` to `{ role: "authenticated", sub, email }` when claims exist and `{ role: "anon" }` otherwise, calls `next()`, and appends every header from the bag to the returned response**, so a token refresh during a request reaches the browser; `getUser()` is not called, because `getClaims()` verifies the token locally and that is enough to scope the database transaction.
4. **`SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are plain `vars` in `wrangler.jsonc`**, not secrets, because the publishable key is designed to be public and the Data API it could reach is disabled; the secret key never enters `apps/web`.
5. **`claimsContext` is the only input to the database:** `repositoriesMiddleware` builds `createUserDb(env.HYPERDRIVE, context.get(claimsContext))` and wraps it in `createDrizzleRepositories(db, { now })`, so RLS sees exactly the verified claims and nothing else, and the fixture factory leaves the app.
6. **Anonymous requests get the `anon` claims and the same repositories**, so the landing page's coach cards and the sign-in page need no special data path.

### Roles and guards

7. **`meMiddleware` runs after the repositories and sets `meContext` to `repositories.me.get()`**, a single query joining the caller's `profiles`, `students` and `coaches` rows under RLS, or `null` for anon; it is the one place roles are read per request.
8. **`requireSignedIn()` redirects to `/sign-in` when `meContext` is `null`**; `requireStudent()` additionally throws `data("Not a student", { status: 403 })` when `me.student` is `null`, else sets `studentIdContext`; `requireCoach()` mirrors it for `coachIdContext`; a wrong role is a 403, not a redirect, because the user is known and simply lacks that role.
9. **A user may hold both roles**, so `RoleNav` renders the union of the role nav groups in a fixed order (student items, then coach items, then Library once), and the header's role badges list every role held; nothing in the UI assumes one role per user.
10. **The home for a signed-in user is the student home if they are a student, else the coach home, else the landing page**, used after sign-in and by the header's brand link; a student who also coaches reaches the queue from the nav. *AMENDED (review):* the third case covers a profile that holds neither role yet, which otherwise landed on a 403; it is computed by one pure `homeFor(me)` beside a `holdsRole(me, role)` predicate in `app/lib/roles.ts`, the single spelling of "has role".
11. **`library.tsx` links items to exercises when `me.student` is not `null`**, replacing the demo-role check.

### Sign-in, confirm, sign-out

12. **`/sign-in` is a page with one email field; its action parses `SignInSchema` and calls `signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/confirm`, shouldCreateUser: false } })`**, then renders "If that address is registered, a sign-in link is on its way" whatever the result, so the page does not reveal which addresses exist; `shouldCreateUser: false` is what makes the alpha invite-only (journal D47).
13. **`/auth/confirm` is a loader route: it parses `token_hash` and `type` from the search params with a Zod schema in `packages/shared` (`type` limited to `magiclink`), calls `verifyOtp({ token_hash, type })`, and redirects to `/sign-in` with the session cookies set, whose loader sends a signed-in user to `homeFor(me)`** (*AMENDED, review:* two hops, because the user's roles can only be read on the next request under the new claims without the confirm route building its own database client); a missing or failed token redirects to `/sign-in` with an error flag, because a magic link is single-use and expired links are the common failure; a verified user with no profile row sees a message on `/sign-in` saying the account is not set up yet.
14. **`/sign-out` is an action-only route: POST calls `signOut({ scope: "local" })` and redirects to `/`** (*AMENDED, review:* local scope ends this browser's session and leaves the tester's other devices signed in); the header renders it as a `<Form method="post">` button, so sign-out is never a GET.
15. **The landing page's "Try the demo" calls to action become "Sign in" links to `/sign-in`**, and the header shows "Sign in" when anonymous or the display name, role badges and "Sign out" when signed in; *AMENDED (review):* below the `sm` breakpoint the display name is hidden so a two-role header fits one row at 375px.
16. **`AlphaBanner` replaces `DemoBanner` on every non-landing page** with the text "Alpha test with real data. Tell the CTO about anything odd.", because the facade's "nothing is saved" is no longer true.
17. **Magic-link delivery in alpha uses Supabase's built-in sender until Resend is wired in S6**, which means only Supabase organisation members (the user) receive links; the founder's first sign-in waits for S6's custom SMTP, and nothing in S3 depends on it.

### Seed and test data

18. **The alpha seed creates the whole fixture cast as auth users:** `coach-founder` with the founder's email, `coach-standard` with the CTO's email, and the four fixture students with `<fixtureId>@singology.test` placeholder addresses that never sign in; **the CTO's user also holds `student-ada`'s student row**, so one person can test both sides of the loop with one account.
19. **The seed loads the fixture coaching data** (enrolments, assignments, submissions with their `local` media, feedback and comments) against those users, with fixture ids mapped through `fixtureUuid` and times resolved from the seed's run time exactly as `createFixtureData(now)` does, so the seeded alpha looks like the facade did.
20. **The seed clears the coaching tables (`submissions`, `feedback`, `feedback_comments`, `assignments`, `events`, `notifications`) before loading them**, so re-running it returns the database to the fixture state; the identity and library tables are upserted as before.
21. **Two Supabase projects, one organisation:** `singology-dev` for humans (the alpha) and **`singology-test` for the test suites**, both Free, because the e2e suite reseeds and therefore wipes coaching data on every run and must never do that to the database the founder is testing on.
22. **`SINGOLOGY_ENV=test` selects `packages/db/.env.test`** (same three keys, the test project's values) in the db scripts, seed and the `test:db` and `test:rls` suites; unset, `.env` and the dev project are used; the e2e server command sets it and derives the Worker's local Hyperdrive string, `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` from that file, so one file is the whole test environment. *AMENDED (S3 type review):* **when `SINGOLOGY_ENV=test` is set and `.env.test` is missing, the loader throws and nothing runs**; it never falls back to the inherited environment, because the test seed wipes coaching tables and must never reach a database the file did not name. The file is read through the one existing reader, `requireEnv(key)` after `SINGOLOGY_ENV` selects the file, exported from `@singology/db/admin` with `supabaseUrlFrom` and `assertTestEnv`, and used by the db scripts and the e2e server alike; `SUPABASE_URL` is derived from `DATABASE_URL`'s project ref and is not a key.
23. **`test:db` and `test:rls` run against the test project by default** (`SINGOLOGY_ENV=test` in their scripts), so a developer cannot accidentally run the mutation suite against the alpha; running them against dev needs the variable unset on purpose.

### E2E sign-in

24. **`signInAs(page, who)` signs the browser in without email:** it calls `magicLinkTokenFor(email)` (the admin API, secret key from `.env.test`) for the seeded user named by `who` (`"founder"` or `"cto"`), then navigates to `/auth/confirm?token_hash=<token>&type=magiclink`, which is the same route a real link hits; no test-only sign-in route exists in the app.
25. **`e2e/global-setup.ts` runs the seed against the test project before the suite**, so every run starts from the fixture state and the time-relative assertions ("Submitted 62 hours ago") hold within the run.
26. **The e2e specs address seeded rows by `fixtureUuid(...)`** instead of fixture ids in URLs, and their name assertions follow the seeded display names ("Singology CTO" where the facade showed "Ada Example"); the smoke route list replaces `/demo` with `/sign-in` and adds `/auth/confirm` failure and `/sign-out`.
27. **`chooseRole` is deleted**; the smoke test "role-scoped routes redirect until a role is picked" becomes "role-scoped routes redirect to `/sign-in` when signed out, and a student is refused the coach queue with 403".

### Lab routes

28. **`/lab/player` addresses its media through `fixtureUuid("media-...")` via the repositories**, so it keeps working on the seeded database without importing fixtures; `/lab/db` stays as the anon round-trip proof.

## 3. Deferred (explicitly out of scope)

- **OAuth providers and passkeys:** beta (journal D47).
- **Self-serve sign-up and an in-app invite UI:** beta; alpha accounts come from the seed.
- **Custom SMTP (Resend) for Supabase Auth:** S6, which also unblocks the founder's sign-in.
- **A `next` parameter on sign-in** to return to the page that required it: not needed with two testers.
- **Profile editing** (display name, voice type): beta.
- **Cloudflare Access removal:** beta (journal D46).

## 4. Retirement

- `apps/web/app/routes/demo.tsx`, `app/components/demo/RoleCard.tsx`, `app/demo/roleCookie.server.ts`, `app/middleware/demoRole.ts`, `app/components/shell/DemoBanner.tsx`, and the `route("demo", ...)` entry are deleted.
- `DEMO_ROLES`, `DemoRoleSchema`, `DemoRoleChoiceSchema` in `packages/shared` are deleted; `DemoRole` becomes `UserRole` with `USER_ROLES`, and `ROLE_LABEL` in `format.ts` follows.
- `DEMO_STUDENT_ID` and `DEMO_COACH_ID` in `packages/db` are deleted; the fixture data keeps its ids as seed keys.
- `createFixtureRepositories` stays for unit tests only; no route or middleware imports it.
- `e2e/helpers.ts` loses `chooseRole`; `e2e/auth.ts` takes its place.
