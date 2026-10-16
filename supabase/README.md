# supabase/

## Alpha reset procedure (spec decision 71; valid until the first beta account)

1. Delete `supabase/migrations/` (the SQL files and drizzle-kit's `meta/`).
2. `pnpm --filter @singology/db generate --name initial_schema` (the schema in `packages/db/src/schema`).
3. `pnpm --filter @singology/db generate --custom --name private_triggers_and_grants`, then restore its
   SQL: the `private` schema, the two trigger functions, the `auth.users` and `updated_at` triggers,
   and the per-table grants. Exactly two migration files remain.
4. `pnpm --filter @singology/db supabase db reset --no-seed`: the CLI resets the remote alpha database
   over `--db-url` (no Docker) and applies both migrations. It also empties `auth.users`.
5. `pnpm --filter @singology/db seed`, twice; `pnpm --filter @singology/db seed:counts` must print the
   same counts after each run.
6. `pnpm --filter @singology/db test:rls`, `test:rls --mutate` and `test:db` must pass.

Day to day: change the schema, `generate`, then `supabase db push`. Never `drizzle-kit push` or
`drizzle-kit migrate`. pgTAP files in `tests/` run only through `test:rls`; each
`<table>.mutation*.sql` beside a test must make it fail.
