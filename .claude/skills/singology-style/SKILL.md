---
name: singology-style
description: The Singology house style rules, the project's canonical ruleset. Load before writing, changing or reviewing any code under apps/, packages/, jobs/ or supabase/ in this repo (TypeScript, React Router v8, Mantine, Drizzle, SQL, pgTAP, UI copy). Every implementation brief and every reviewer loads it; it is deliberately not in CLAUDE.md so that an agent working on one layer loads it on purpose rather than carrying every rule by default.
---

# Singology house style

These are fixed project decisions, recorded in the arc journals under `notes/`. Each rule removes one way the same thing could be written. An unmarked deviation is a defect; a deliberate deviation carries a one-line _why_ at the site. Section headings say which layer a rule binds, so read the sections that touch your change and the General section always.

## General

- Prettier (`printWidth: 100`) owns layout. Never spend effort or review findings on formatting. Lint rules in `eslint.config.js` are machine-owned; an `eslint-disable` is a deviation and needs its one-line why.
- Comments are kept to intent the code cannot express: one line of _why_, or an API contract the types cannot state. No JSDoc that restates a name, type or signature. No process narration, no pitfall or decision numbers in source, no section-header comments, no commented-out code.
- Types derive from the Zod schemas in `packages/shared` (`z.infer`); never hand-write a parallel interface or copy a field list (use `.pick`, `.extend`, `Pick`, `Omit`). No `any`. `@ts-ignore` / `@ts-expect-error` need a written reason on the same line. `consistent-type-imports` is on.
- No floating promises, no async callback passed to `forEach`.
- Files: components `PascalCase.tsx`, hooks `useX.ts`, pure modules `camelCase.ts`. One component per file, except a private sub-component used only by its parent. Tests sit beside their unit as `*.test.ts`, or under `apps/web/e2e/` for Playwright, `packages/db/test/` for integration, `supabase/tests/` for pgTAP. No `index.ts` barrels inside `apps/web`; a package's single public entry is the one legitimate barrel.
- Package levels are strict and acyclic: `packages/shared` imports no workspace package; `packages/db` imports only `shared`; `apps/*` and `jobs/*` import downward and never each other. Always import a package through its public entry (`@singology/db`, `@singology/db/admin`), never a deep path.
- The language target is ES2023 (`lib: ES2023`): `toSorted`, `findLast` and friends are fine; grouping goes through the shared `groupBy` helper, never `Map.groupBy` (Safari 17.4), never a hand-rolled loop. Ordered lookups go through `indexById` and `pickByIds`.
- Secrets live only in the ignored env files; never print, log or commit a value from them.

## Routing and data access (`apps/web`)

- React Router v8 imports come only from `react-router` and `react-router/dom`. `react-router-dom` does not exist here; never add it. Route types come from `./+types/<route>`. Deploy only through `@cloudflare/vite-plugin`.
- Routes and components read data only through the repositories on the router context (`context.get(repositoriesContext)`). No route or component imports fixture data, constructs a database client, or calls Supabase directly. `createAdminDb` and `@singology/db/admin` appear only inside `packages/db`, webhook resource routes, jobs and test code; ESLint enforces it.
- One form per mutation: a route `action` that parses its input with a Zod schema from `packages/shared` through `parseInput` and returns an `ActionResult`. No ad-hoc `fetch` to the app's own routes, no unvalidated `formData.get` chains.
- One rule for request encoding: a native `<Form>` posts form data parsed with `Schema.safeParse(Object.fromEntries(formData))`; fetcher submissions post JSON read with `readJson(request)`.
- Missing data in a loader is `throw data("...", { status: 404 })`; a wrong role is a 403; a missing session redirects to sign-in.
- URL-representable UI state (filters, tabs, selection that should survive reload) lives in search params, not component state.
- A route module holds its loader, action, meta and default component and may exceed 150 lines for those; any other component in a route module moves to `components/<feature>/`. Components elsewhere stay under 150 lines.

## State and time (`apps/web`)

- No global client store. Page-local state uses `useReducer` or `useState`; the player uses its `PlayerProvider` reducer. A new store is a deviation that needs its explicit justification.
- High-frequency media time never goes into React state; the waveform drives its own cursor.
- Dates rendered on server and client go through the UTC helpers in `app/lib/format.ts`; live clocks go through `useNow` (`useSyncExternalStore`). No `Date.now()`, `new Date()` or `Math.random()` in render paths. The server-rendered text must equal the first client render.

## UI (`apps/web`)

- Mantine components over raw HTML where an equivalent exists; theme tokens over magic values for spacing, colour, radius and typography.
- React Router links inside Mantine use a polymorphic component (`Anchor`, `Button`, `UnstyledButton` with `component={Link}`); `Title` is not polymorphic. Do not put block components (`Badge`, `Group`, `Stack`, `Card`) inside `Text`.
- Shared UI (the player, the upload panel) is reused through its public API, never forked or copied.
- Student surfaces must work at 375px width; nothing may overflow the viewport sideways.
- Copy follows `notes/design-system/README.md`: British English, sentence case for everything typed, "we" and "you", plain words for technique, one exclamation mark per screen, no emoji, errors that are kind and specific. The brand is expressed through the Mantine theme, never by adopting the design system's `sg-` classes.

## Data layer, SQL and Drizzle (`packages/db`, `supabase/`)

- The Drizzle schema in `packages/db/src/schema/` is the single source of the database shape. Migrations are drizzle-kit output in `supabase/migrations/`, applied with the Supabase CLI through `pnpm --filter @singology/db supabase`; never `drizzle-kit push` or `migrate`. The custom migration is generated by `generate:private`, never hand-edited.
- Identifiers are lowercase `snake_case`; tables plural; foreign keys `<entity>_id`; timestamps `timestamptz` named `<event>_at`; `text` not `varchar`; every foreign key and every policy column indexed.
- Enums are `pgEnum` built from the matching `packages/shared` `as const` array, declared once; never repeated as a string union elsewhere.
- RLS is the authority. Policies are declared beside their table with `pgPolicy`, using the shared helpers in `packages/db/src/schema/policies.ts`; every predicate wraps the caller in `(select auth.uid())` via `authUid` from `drizzle-orm/supabase`; no `sql.raw`, no string column names.
- Every user-scoped query runs through `createUserDb`, one RLS transaction per repository method, with the role chosen from a whitelist and the claims bound as a parameter. The row-to-domain mappers in `packages/db/src/drizzle/mappers.ts` are the only place a database row becomes a domain type.
- The query builder is the default. A raw `sql` template is a deviation that needs a one-line why. Aggregation, filtering, sorting and joining happen in the query, not in TypeScript over rows; no `await` inside a loop over rows.
- The fixture implementation of `Repositories` mirrors the Drizzle one module for module and shares its helpers; logic is never written twice across the two.
- Every policy has a pgTAP file beside it under `supabase/tests/` and a `<table>.mutation*.sql` sibling that makes it fail; a policy test without a failing case is not accepted.

## Workers (`apps/web/workers`)

- Module scope persists across requests in an isolate: never hoist request-scoped values (claims, repositories, the request's `now`) to module scope.
- Any media-serving code path is checked with a `Range` request before it is accepted.
- A scheduled handler never throws out; it logs one summary line per tick.
