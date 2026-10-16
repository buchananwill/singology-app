---
title: "Slice Schema: Fixed Design Decisions"
type: decision-spec
status: proposed
---

# Slice Schema

This document fixes the Postgres schema behind the alpha, its Row Level Security, the Drizzle data layer in `packages/db` that implements the existing `Repositories` interface, and the migration and test tooling around them. It reconciles two sources: the facade's Zod domain types in `packages/shared` (the proven shape of what the UI reads) and the WP4 data model sketch (the relational and RLS shape). It is written so the schema survives into beta with only additive, data-preserving migrations: every table, column and constraint here is one the alpha needs, and every later feature is given a named place to attach.

The document fixes the roster (§1) and the decisions (§2). It carries no implementation bodies: declarations and policy rules in prose are fixed, query bodies and mapping code belong to the implementer. Work-package context (S2 in `notes/gtm-journal-02.md`) is attached at dispatch, not here.

## 1. Type Roster

**Postgres, schema `public` (all names lowercase `snake_case`; tables plural)**

- `profiles` — one row per `auth.users` row, created by trigger; display name and the join point for both roles.
- `coaches` — role row keyed by `user_id`; tier, bio, avatar, turnaround; `active` controls public listing.
- `coach_offers` — a coach's illustrative price offers, read by the landing page; where Stripe prices attach later.
- `students` — role row keyed by `user_id`; voice type.
- `enrolments` — a student with a coach under an offer; the RLS anchor for everything below it.
- `library_items` — the exercise library; category, difficulty, demo and backing-track media.
- `collections` — a named, ordered grouping of exercises (the founder's programmes); an item may sit in several.
- `collection_items` — the ordered join from `collections` to `library_items`.
- `tags` — the master list of open-ended labels, each under a `kind` (the first kind is `focus`, the technical-focus facet).
- `library_item_tags` — the join from `library_items` to `tags`.
- `media_assets` — every uploaded or seeded file: which store holds it, processing status, playback URLs, peaks, duration.
- `assignments` — an exercise set for an enrolment; status is derived, never stored.
- `submissions` — a student's take of an exercise, referencing one media asset.
- `feedback` — a coach's one reply to a submission: summary, optional reply media.
- `feedback_comments` — timestamped comments on a feedback row.
- `events` — append-only analytics for the pilot metrics, written from day one.
- `notifications` — the sent-log for nudge emails; the idempotency key for every send.

**Postgres enums (one `pgEnum` each, values from the `packages/shared` constant arrays)**

- `coach_tier`, `offer_billing`, `voice_type`, `library_category`, `difficulty`, `media_kind`, `enrolment_status`, `submission_status`, `media_store`, `media_status`, `notification_kind`.

**Postgres, schema `private` (helpers never exposed through the API)**

- `private.handle_new_user()` — trigger function on `auth.users` insert that creates the `profiles` row.
- `private.touch_updated_at()` — trigger function that maintains `updated_at` on tables that carry it.

**`packages/shared` (`@singology/shared`), changed**

- `EnrolmentSchema` — before: `{ id, studentId, coachId, offerId, status, currentPeriodEnd, submissionsUsed }` → after: `{ id, studentId, coachId, offerId, status, startedAt }`.
- `SUBMISSION_STATUSES` — before: `["awaiting_review", "reviewed"]` → after: `["processing", "awaiting_review", "reviewed", "failed"]`.
- `MEDIA_STORES`, `MEDIA_STATUSES`, `EVENT_KINDS`, `NOTIFICATION_KINDS` — new constant arrays, with their Zod enums and inferred types.
- `LibraryItemSchema` — before: `{ id, title, category, voiceTypes, instructions, demoMediaId, backingTrackMediaId? }` → after: the same plus `difficulty: Difficulty` and `tags: Tag[]`.
- `DIFFICULTIES`, `TAG_KINDS`, `TagSchema` (`{ kind, slug, label }`), `CollectionSchema` (`{ id, title, description, position, itemIds }`) — new.
- `MediaAssetSchema` — unchanged in shape; it is the **ready** projection of a `media_assets` row.
- `CreateSubmission`, `SendFeedback` (exists), `RecordEvent` — the write DTOs the repositories accept.

**`packages/db` (`@singology/db`), new**

- `src/schema/*.ts` — the Drizzle schema, one file per table group, with `pgPolicy` declarations beside each table; `src/schema/index.ts` re-exports all of it for drizzle-kit.
- `src/client.ts` — `createUserDb(connectionString, claims)` and `createAdminDb(connectionString)`.
- `src/drizzle/createDrizzleRepositories.ts` — `createDrizzleRepositories(db: UserDb, options: RepositoryOptions): Repositories`.
- `src/drizzle/mappers.ts` — row-to-domain projections, one function per domain type.
- `src/repositories.ts` — the existing interface, extended with the write methods in decision 50.
- `drizzle.config.ts` — drizzle-kit 0.31.x configuration.
- `src/seed/seedAlpha.ts` — the alpha seed script, built on the existing `createFixtureData`.

**`supabase/` (new workspace folder, not a package)**

- `config.toml` — the Supabase CLI project config.
- `migrations/` — drizzle-kit output and `--custom` SQL files; never hand-edited after generation.
- `tests/*.sql` — pgTAP tests for the RLS policies.

**`apps/web`, touched only at the seam**

- `app/middleware/repositories.ts` — **untouched until S3**: the swap to `createDrizzleRepositories` over a per-request `UserDb` needs real user ids, which arrive with Supabase Auth; the fixtures and the demo role stay until then.
- `app/routes/lab.db.tsx` — an unlinked lab route (like `/lab/player`) whose loader runs one `anon` RLS transaction through the `HYPERDRIVE` binding and renders the count of active coaches; the Worker-to-Postgres proof.
- `wrangler.jsonc` — gains the `HYPERDRIVE` binding.

## 2. Decisions

### Conventions

1. **Identifiers are lowercase `snake_case`**, tables are plural, foreign keys are `<entity>_id`, timestamps are `timestamptz` named `<event>_at`, because Postgres folds unquoted identifiers and the Drizzle schema maps camelCase properties to these names explicitly.
2. **Every primary key is `uuid` with `default gen_random_uuid()`**; ids appear in URLs so they must be unguessable, and index fragmentation is irrelevant at this scale.
3. **Role rows use the user's id as their primary key:** `coaches.user_id` and `students.user_id` both reference `profiles.id`, so `Coach.id` and `Student.id` in the domain types are the user's id and no separate role id exists.
4. **Every enum is a `pgEnum` built from the matching `packages/shared` `as const` array** (`z.enum(COACH_TIERS)` and `pgEnum("coach_tier", COACH_TIERS)` share one source), so a value can never exist in one place and not the other.
5. **Every foreign key column and every column named in a policy has an index**, because Postgres does not index foreign keys and RLS predicates run on every query.
6. **Every table has `created_at timestamptz not null default now()`**; tables that are edited in place (`profiles`, `coaches`, `coach_offers`, `students`, `library_items`, `media_assets`) also have `updated_at`, maintained by the `private.touch_updated_at()` trigger.
7. **Text columns are `text`**, never `varchar(n)`; length limits live in the Zod schemas that validate input.
8. **Money is integer pence** (`price_pence integer`), matching `CoachOffer.pricePence`.
9. **Domain types keep ISO-8601 strings for times** (`IsoDateTimeSchema`), and the mappers in `packages/db` convert `Date` to ISO on the way out, so routes and components do not change.

### Identity and roles

10. **`profiles` is 1:1 with `auth.users`** (`id uuid primary key references auth.users(id) on delete cascade`, `display_name text not null`, `created_at`, `updated_at`), created by `private.handle_new_user()` on insert into `auth.users`, with the display name taken from `raw_user_meta_data->>'display_name'` or else the email's local part.
11. **A user's roles are the presence of a `coaches` row and/or a `students` row**; there is no roles table and no JWT role claim, because two tables with a shared key express "a user can be both" without a hook or a join table.
12. **`coaches`:** `user_id uuid primary key references profiles(id) on delete cascade`, `tier coach_tier not null`, `bio text not null default ''`, `avatar_src text not null`, `turnaround_hours integer not null check (turnaround_hours > 0)`, `active boolean not null default false`, timestamps.
13. **`students`:** `user_id uuid primary key references profiles(id) on delete cascade`, `voice_type voice_type not null`, timestamps.
14. **`coach_offers`:** `id`, `coach_id references coaches(user_id) on delete cascade`, `tier coach_tier not null`, `name text not null`, `billing offer_billing not null`, `price_pence integer not null check (price_pence >= 0)`, `submissions_per_period integer not null check (submissions_per_period > 0)`, `active boolean not null default true`, timestamps; **Stripe attaches here later as a nullable `stripe_price_id text` column**, which is an additive migration.

### Enrolments

15. **`enrolments`:** `id`, `student_id references students(user_id)`, `coach_id references coaches(user_id)`, `offer_id references coach_offers(id)`, `status enrolment_status not null default 'active'`, `started_at timestamptz not null default now()`, `ended_at timestamptz` (null while not ended), `created_at`.
16. **`currentPeriodEnd` and `submissionsUsed` are removed from the `Enrolment` domain type and do not exist as columns**; nothing in the app reads them, and they are billing state that beta attaches as a separate `enrolment_subscriptions` table (`enrolment_id`, `stripe_subscription_id`, `current_period_end`, `submissions_used`) so the alpha schema never changes shape for Stripe.
17. **A student has at most one active enrolment:** a partial unique index on `enrolments(student_id) where status = 'active'`, because the student home page shows "your coach" in the singular; relaxing it later is dropping an index, which is non-destructive.
18. **Deleting a student, coach or offer is not a product operation**; `enrolments.student_id` and `coach_id` are `on delete restrict`, so an account closure must end the enrolment first.

### Library and media

19. **`library_items`:** `id`, `title text not null`, `category library_category not null`, `difficulty difficulty not null`, `voice_types voice_type[] not null check (cardinality(voice_types) > 0)`, `instructions text not null default ''`, `demo_media_id references media_assets(id) on delete restrict`, `backing_track_media_id references media_assets(id) on delete restrict` (nullable), `owner_coach_id references coaches(user_id)` (nullable; null is platform-owned), `active boolean not null default true`, timestamps.
20. **`voice_types` is an enum array, not a join table**, because the library is small, the filter is `voice_type = any(voice_types)`, and a join table would add a type and two queries for no reader.
21. **`media_assets`:** `id`, `kind media_kind not null`, `owner_user_id references profiles(id)` (nullable; null for seeded library media), `store media_store not null`, `store_key text not null` (the Bunny video id, the Storage path, or the local public path), `status media_status not null default 'pending'`, `src text`, `hls_src text`, `peaks_src text`, `duration_sec double precision check (duration_sec > 0)`, `original_file_name text not null default ''`, `size_bytes bigint`, `mime_type text`, `failure_reason text`, timestamps.
22. **`media_store` is `'local' | 'bunny_stream' | 'bunny_storage'`** and `media_status` is `'pending' | 'ready' | 'failed'`; `'local'` is the facade's `/media/*` path and is what every seeded asset uses until Bunny is switched on, so the player needs no change before S4.
23. **A `media_assets` row is `ready` only when `src`, `peaks_src` and `duration_sec` are all non-null**, enforced by a check constraint `(status <> 'ready') or (src is not null and peaks_src is not null and duration_sec is not null)`, which is exactly what makes decision 24 total.
24. **The `MediaAsset` domain type is the projection of a `ready` row**, and `media.get` and `media.getMany` return only ready rows, so the player never receives an asset without peaks and the facade's `MediaAssetSchema` stays as it is.
25. **The media job (S4) is the only writer of `status = 'ready'`**, through `adminDb`; the app writes `pending` rows at upload registration and never flips status itself.

### Assignments, submissions and feedback

26. **`assignments`:** `id`, `enrolment_id references enrolments(id) on delete cascade`, `library_item_id references library_items(id) on delete restrict`, `assigned_at timestamptz not null default now()`, `feedback_id references feedback(id) on delete set null` (nullable: which feedback assigned it; null when seeded or assigned directly), `created_at`.
27. **`Assignment.status` is derived, never stored:** `todo` when no submission references the assignment, `submitted` when one does and none is `reviewed`, `feedback_ready` when a `reviewed` submission references it; the repository computes it in the query, because a stored status is a second copy of a fact the `submissions` table already holds.
28. **`submissions`:** `id`, `enrolment_id references enrolments(id) on delete cascade`, `assignment_id references assignments(id) on delete set null` (nullable: unassigned practice from the library is allowed), `library_item_id references library_items(id) on delete restrict`, `media_id references media_assets(id) on delete restrict`, `note text not null default ''`, `submitted_at timestamptz not null default now()`, `status submission_status not null default 'processing'`, `created_at`.
29. **`submission_status` is `'processing' | 'awaiting_review' | 'reviewed' | 'failed'`**: a submission is created `processing` alongside its `pending` media asset, the media job sets `awaiting_review` (or `failed` with the asset's `failure_reason`) through `adminDb`, and `feedback.send` sets `reviewed`; the coach queue reads only `awaiting_review`, and the student sees `processing` and `failed` as plain states.
30. **When `assignment_id` is set, the submission's `library_item_id` equals the assignment's**, enforced by the single insert path `submissions.create` rather than a cross-table constraint, because it is one code path and a trigger would duplicate the rule.
31. **`feedback`:** `id`, `submission_id references submissions(id) on delete cascade unique`, `coach_id references coaches(user_id)`, `body text not null default ''`, `reply_media_id references media_assets(id) on delete restrict` (nullable), `sent_at timestamptz not null default now()`, `created_at`; **the unique constraint makes "one feedback per submission" a database fact**, matching `feedback.forSubmissionWithComments` returning a single row.
32. **There are no draft feedback rows**; the review workspace already holds its draft in page-local state and posts the whole review at once, so `feedback.send` inserts the feedback, its comments, the submission's `reviewed` status and the next assignments **in one transaction**.
33. **`feedback_comments`:** `id`, `feedback_id references feedback(id) on delete cascade`, `t_seconds double precision not null check (t_seconds >= 0)`, `body text not null check (body <> '')`, `created_at`; read ordered by `t_seconds`.
34. **A coach's reply media is uploaded before the feedback is sent**, so a `media_assets` row with `owner_user_id` = the coach exists unattached until `feedback.reply_media_id` points at it; unattached replies are left alone in alpha (see §3).

### Events and notifications

35. **`events`:** `id bigint generated always as identity primary key`, `user_id references profiles(id) on delete set null` (nullable), `kind text not null`, `entity_id uuid` (nullable), `meta jsonb not null default '{}'`, `at timestamptz not null default now()`; append-only, with an index on `(kind, at)` and on `(user_id, at)`.
36. **`EVENT_KINDS` is `['signed_in', 'submission_created', 'feedback_sent', 'feedback_viewed']`** as a shared constant checked by Zod on the way in; `kind` is `text` in the database, not an enum, because adding an event kind must never be a migration.
37. **`events` exists to answer the pilot metrics** (weekly submission rate, median turnaround, time-to-view feedback, retention), so `submission_created` carries `{ enrolmentId, libraryItemId }` and `feedback_viewed` carries `{ submissionId }` in `meta`; turnaround itself is computed from `submissions.submitted_at` and `feedback.sent_at`, not from events.
38. **`notifications`:** `id`, `user_id references profiles(id) on delete cascade`, `kind notification_kind not null`, `entity_id uuid` (nullable: the feedback or submission the email is about), `period_start date` (nullable: the week a practice reminder covers), `sent_at timestamptz not null default now()`, `provider_message_id text`.
39. **`notification_kind` is `'feedback_ready' | 'new_submission' | 'practice_reminder'`**, the three alpha nudges and nothing else.
40. **A nudge can only be sent once:** a partial unique index on `notifications(kind, entity_id) where entity_id is not null` and another on `notifications(kind, user_id, period_start) where period_start is not null`, so the sender inserts first and sends only when the insert succeeds.

### Row Level Security

41. **Every `public` table has RLS enabled (not forced)** and policies are declared beside the table with Drizzle's `pgPolicy`, so the schema file is the single statement of who may read what; the `postgres` role, which `adminDb` uses, has `bypassrls` on Supabase and so is unaffected.
42. **Every policy predicate wraps the caller in a subquery, `(select auth.uid())`**, so the function runs once per query rather than once per row.
43. **A user-scoped query is one transaction that first runs `set local role authenticated` (or `anon`) and `select set_config('request.jwt.claims', $1, true)` with the claims passed as a bound parameter and the role name chosen from a two-value whitelist**, never interpolated, because Drizzle's documented example interpolates and that is an injection path.
44. **Anonymous requests (the landing page) run as `anon` with no claims**, and the only `anon` policies are `select` on `coaches` where `active` and `select` on `coach_offers` where `active`, which is what the coach cards and pricing table need.
45. **`profiles`:** a user selects and updates their own row; a user also selects the profile of anyone on the other side of one of their enrolments (`exists` over `enrolments` joined to the caller's role row), because the queue shows student names and the student home shows the coach's name.
46. **`coaches` and `coach_offers`:** `authenticated` selects where `active`, plus a coach selects and updates their own `coaches` row and their own offers; no insert policy, because coaches are created by the admin seed.
47. **`students`:** a student selects and updates their own row; a coach selects students who have an enrolment with them.
48. **`enrolments`:** a student selects rows where `student_id = (select auth.uid())`; a coach selects rows where `coach_id = (select auth.uid())`; no insert, update or delete policy, because enrolment changes are an admin operation in alpha.
49. **`library_items`, `collections`, `collection_items`, `tags` and `library_item_tags`:** `authenticated` selects (`library_items` and `collections` where `active`; the join and tag tables unconditionally, since they carry nothing private); no write policies, because library authoring is by the admin seed in alpha.
50. **`media_assets`:** `authenticated` selects a row when `owner_user_id = (select auth.uid())`, or the row is referenced by an active `library_items` row (demo or backing track), or it is referenced by a `submissions` or `feedback` row the caller can select (an `exists` against those tables, which themselves apply their own policies); `authenticated` inserts a row only with `owner_user_id = (select auth.uid())` and `status = 'pending'`; no update or delete policy, because status is the job's.
51. **`submissions`:** a student selects rows whose enrolment is theirs and inserts rows whose enrolment is theirs and `active`; a coach selects rows whose enrolment is theirs; a coach updates rows whose enrolment is theirs (the `reviewed` flip inside `feedback.send`); no delete policy.
52. **`feedback` and `feedback_comments`:** a coach inserts rows for submissions whose enrolment is theirs and selects them; a student selects rows for submissions whose enrolment is theirs; comments inherit through `feedback_id`; no update or delete policy, because sent feedback is immutable in alpha.
53. **`assignments`:** a coach inserts and selects rows for their enrolments; a student selects rows for their enrolments; no update or delete policy.
54. **`events`:** `authenticated` inserts rows where `user_id = (select auth.uid())`; no select policy for `authenticated`, because analytics are read by `adminDb` only.
55. **`notifications`:** no `authenticated` policies at all; the sender runs through `adminDb`.
56. **Each policy is a pgTAP test in `supabase/tests/`** that sets the claims for a student, their coach, an unrelated coach and `anon`, and asserts the visible row count for each; a policy without a failing-case assertion (the unrelated coach sees zero rows) is not accepted.

### Data layer

57. **Only the Worker connects to Postgres, through a Hyperdrive config created with caching disabled**, bound as `HYPERDRIVE` in `wrangler.jsonc`, because a cached read cannot know the session's claims.
58. **The Hyperdrive origin is Supabase's session pooler (port 5432)**, which is reachable over IPv4 and honours `set local`; the transaction pooler (6543) is never used behind Hyperdrive, and the first S2 spike records whether the direct connection also works, as a finding for a later switch that is configuration only.
59. **The driver is `pg` 8.16 or later with `drizzle-orm/node-postgres`** and `drizzle-orm` 0.45.x, per Cloudflare's recommendation for Hyperdrive; `postgres.js` is not used.
60. **`createUserDb(connectionString, claims)` returns a `UserDb`**, a function `<T>(work: (tx: Transaction) => Promise<T>) => Promise<T>` that opens one connection, runs decision 43's two statements, runs `work`, and commits; **each repository method is one `UserDb` call**, so a loader's `Promise.all` of several methods is several short transactions, which is the right shape for Hyperdrive, which pools in transaction mode.

```ts
export interface Claims {
  role: "authenticated" | "anon";
  sub?: string;
  email?: string;
}
export type UserDb = <T>(work: (tx: Transaction) => Promise<T>) => Promise<T>;
export function createUserDb(connectionString: string, claims: Claims): UserDb;
export function createAdminDb(connectionString: string): Db;
```

61. **`adminDb` is permitted only in webhook resource routes (`app/routes/api.*`), the media job, the notification sender and the seed**, enforced by an ESLint `no-restricted-imports` rule on `@singology/db/admin` outside those paths, because one form per privilege level is what makes a privileged call visible in review.
62. **`createDrizzleRepositories(db, options)` implements the existing `Repositories` interface unchanged** and accepts `RepositoryOptions` for the `now` argument the fixture implementation needs, ignoring it, so root middleware swaps one factory call when S3 wires real sessions; until then its correctness is proven by integration tests in `packages/db` that run against the alpha database (`pnpm --filter @singology/db test:db`, excluded from the root `pnpm test`).
63. **`Repositories` gains these write methods**, each a single transaction with the ownership check inside it and each returning the domain object it created:

```ts
export interface SubmissionRepository {
  // existing methods unchanged
  create(input: CreateSubmission): Promise<Submission>;
}
export interface FeedbackRepository {
  // existing methods unchanged
  send(input: SendFeedbackInput): Promise<FeedbackWithComments>;
}
export interface MediaRepository {
  // existing methods unchanged
  register(input: RegisterMedia): Promise<{ id: string }>;
}
export interface EventRepository {
  record(input: RecordEvent): Promise<void>;
}
export interface Repositories {
  // existing fields unchanged
  events: EventRepository;
}
```

64. **`CreateSubmission` is `{ enrolmentId, assignmentId?, libraryItemId, mediaId, note }`**, `SendFeedbackInput` is the existing `SendFeedback` DTO plus `{ submissionId, replyMediaId? }`, `RegisterMedia` is `{ kind, store, storeKey, originalFileName, sizeBytes, mimeType }`, and `RecordEvent` is `{ kind: EventKind, entityId?, meta? }`; all four are Zod schemas in `packages/shared`.
65. **`feedback.send` inserts the feedback row, its comments, the `reviewed` status on the submission, and one `assignments` row per `assignLibraryItemIds` entry with `feedback_id` set, in that transaction**, and a failure anywhere rolls the whole review back.
66. **The fixture implementation stays**, implementing the same extended interface in memory (writes mutate the in-memory copy for the request), because unit tests and `/lab/player` keep running without a database.
67. **The mappers are the only place a database row becomes a domain type**, one exported function per domain type in `mappers.ts`, and every mapper's output is validated once in a unit test against the Zod schema, so a column rename cannot silently change the API.

### Migrations, seed and tooling

68. **drizzle-kit is pinned to `0.31.x`** with `dialect: "postgresql"`, `schema: "./src/schema/index.ts"`, `out: "../../supabase/migrations"` and `migrations: { prefix: "supabase" }`, so files are flat `<timestamp>_<name>.sql` as Supabase expects; drizzle-kit v1 is not used until its per-folder layout is fixed.
69. **Hand-written SQL (the `private` schema, the two trigger functions, the `auth.users` trigger, RLS enable statements if drizzle-kit does not emit them, grants) goes in `drizzle-kit generate --custom` files**, so every migration is in one folder in one order.
70. **Migrations are applied with the Supabase CLI against the linked alpha project**; `drizzle-kit push` and `drizzle-kit migrate` are never run against a shared database, because the CLI's migration table is the one record of what has been applied.
71. **Alpha migrations may be squashed:** until the first beta account exists, the implementer may delete the alpha database's `supabase/migrations/*` and regenerate one initial migration; after that, every migration is additive and data-preserving.
72. **The `public` schema is removed from the Data API's exposed schemas** in the Supabase project settings, so PostgREST serves nothing and the publishable key can read nothing.
73. **`seedAlpha.ts` runs with `adminDb` and the Supabase admin auth API**: it creates the alpha users (the founder as a coach, the CTO as a student and as a second coach for testing), their profiles, roles, one enrolment, and inserts the existing `createFixtureData` library items (each given a difficulty, focus tags and a collection in the fixture data) and media assets with `store = 'local'` and `status = 'ready'`, so the alpha starts with the facade's library and playable media.
74. **The seed is idempotent** (upserts on natural keys: email for users, the fixture ids for library and media), so it can be re-run after a squash without manual cleanup.
75. **`pnpm --filter @singology/db` gains the scripts `generate` (drizzle-kit), `seed` and `test:rls`**, and the root `pnpm test` keeps excluding the RLS tests because they need a database.
76. **pgTAP tests run against the alpha database without Docker**, through `supabase test db --linked` if that command runs on Windows without a local stack, and otherwise through a small Node runner that executes `supabase/tests/*.sql` over the direct connection and checks the TAP output; the implementer verifies which and records it in the pitfalls log.
77. **Secrets are three keys and no more:** `DATABASE_URL` (the session-pooler string, for migrations, seed and RLS tests) and `SUPABASE_DB_PASSWORD` (for the Supabase CLI) in `packages/db/.env`, and `WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` (the same session-pooler string, which `wrangler dev` substitutes for the `HYPERDRIVE` binding) in `apps/web/.dev.vars`; in production the Worker reads `env.HYPERDRIVE.connectionString`; both files are ignored and no secret appears in a committed file.

### Collections, tags and the extension rule

78. **The extension rule, for every later "where does this attribute live" question:** a **single-valued attribute from a closed set** is a column (an enum, like `category` and `difficulty`); a **multi-valued attribute from a closed set** is an enum array column (like `voice_types`); a **multi-valued, open-ended label** is rows in `tags` under a `kind` plus a row per link in the join table (like focus); a **thing with its own attributes or lifecycle** is its own table (like `collections`). Each later addition names which of the four it is, and beta tests the boundary deliberately (decision 86).
79. **`difficulty` is a `pgEnum` `('beginner', 'improver', 'intermediate', 'advanced')`**, a required column on `library_items`, because it is single-valued and ordered, and a sort by difficulty must not need a join; the labels live in `packages/shared` next to the category labels.
80. **`tags`:** `id`, `kind text not null`, `slug text not null`, `label text not null`, `position integer not null default 0`, timestamps, with `unique (kind, slug)`; **`kind` is `text` checked against the shared `TAG_KINDS` constant**, not an enum, so a new facet is a new row value and never a migration.
81. **`TAG_KINDS` is `['focus']` in alpha**: the technical-focus facet (for example `legato`, `register-transition`, `vowel-shape`), with the founder's vocabulary entered through the seed.
82. **`library_item_tags`:** `library_item_id references library_items(id) on delete cascade`, `tag_id references tags(id) on delete restrict`, `primary key (library_item_id, tag_id)`, with an index on `tag_id`; a tag in use cannot be deleted, it is relabelled.
83. **`collections`:** `id`, `title text not null`, `description text not null default ''`, `owner_coach_id references coaches(user_id)` (nullable; null is platform-owned), `position integer not null default 0`, `active boolean not null default true`, timestamps.
84. **`collection_items`:** `collection_id references collections(id) on delete cascade`, `library_item_id references library_items(id) on delete cascade`, `position integer not null`, `primary key (collection_id, library_item_id)`, `unique (collection_id, position)`, with an index on `library_item_id`; an item may belong to several collections.
85. **`LibraryItem` gains `difficulty` and `tags`** (each tag as `{ kind, slug, label }`, so the UI renders labels without a lookup), `LibraryRepository` gains `listCollections(): Promise<Collection[]>` returning collections with their ordered `itemIds`, and `LibraryFilter` gains optional `difficulty` and `tag` (a slug); the library page grouping by collection is UI work for a later package, not this one.
86. **Beta's planned test of the extension rule is to fold `category` into `tags` as `kind = 'category'`** and compare the filter code and queries before and after; until that test is run and ruled on, `category` stays a column.

## 3. Deferred (explicitly out of scope)

- **Billing:** `enrolment_subscriptions`, `billing_customers`, `stripe_events`, `coach_offers.stripe_price_id`. All additive. Stripe is a later arc.
- **Guardians and minors:** `guardianships`, `consent_records`. Additive; adults only at launch.
- **`audit_log` and `messages`:** no alpha surface reads them.
- **Retention (video to audio after 90 days):** a job over `media_assets`; no schema change needed beyond what is here.
- **Library authoring UI and write policies on `library_items`:** the seed is the library in alpha.
- **Cleanup of unattached reply media:** a scheduled job; harmless in alpha.
- **Column-level grants** (restricting a coach's `submissions` update to `status`) and a **dedicated login role** with less privilege than `postgres` for Hyperdrive: hardening for beta.
- **JWT role claims via a custom access token hook:** not needed while roles are two table lookups.
- **Supabase Branching and per-branch databases:** Pro-only; a beta concern.

## 4. Retirement

- `EnrolmentSchema.currentPeriodEnd` and `EnrolmentSchema.submissionsUsed` are deleted from `packages/shared/src/schemas.ts`, and the matching fields from `packages/db/src/fixtures/data.ts`.
- `createFixtureRepositories` stays, extended with the write methods; it is the test double and the seed source, not dead code.
- `DEMO_STUDENT_ID`, `DEMO_COACH_ID`, `DEMO_ROLES` and the demo-role middleware are untouched here and retire in S3.
