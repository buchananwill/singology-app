# supabase/

## Alpha reset procedure (spec decision 71; valid until the first beta account)

1. Delete `supabase/migrations/` (the SQL files and drizzle-kit's `meta/`).
2. `pnpm --filter @singology/db generate --name initial_schema` (the schema in `packages/db/src/schema`).
3. `pnpm --filter @singology/db generate --custom --name private_triggers_and_grants`, then
   `pnpm --filter @singology/db generate:private`, which writes that file from the schema: the
   `private` schema, the two trigger functions, the `auth.users` trigger, a touch trigger per table
   with `updated_at`, and grants derived from each table's policies. Two migration files remain.
4. `pnpm --filter @singology/db supabase db reset --no-seed`: the CLI resets the remote alpha database
   over `--db-url` (no Docker) and applies both migrations. It also empties `auth.users`.
5. `pnpm --filter @singology/db seed`, twice; `pnpm --filter @singology/db seed:counts` must print the
   same counts after each run.
6. `pnpm --filter @singology/db test:rls`, `test:rls --mutate` and `test:db` must pass.

## Signing in during alpha

Until S6 wires Resend, `pnpm -s --filter @singology/web sign-in-link <email> [--origin <app origin>]` prints a single-use sign-in URL for a seeded user (dev by default, `SINGOLOGY_ENV=test` for the test project).

## Day to day

Day to day: change the schema, `generate`, then `supabase db push`. Never `drizzle-kit push` or
`drizzle-kit migrate`. pgTAP files in `tests/` run only through `test:rls`; each
`<table>.mutation*.sql` beside a test must make it fail.
