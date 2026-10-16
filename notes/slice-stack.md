---
title: "Singology Slice: Committed Stack"
type: spec
status: active
---

# Singology Slice: Committed Stack

**This is the immediate path.** The founder has approved the GTM proposal and the facade (2026-10-16). The research briefs in [research/](./research/) laid out options; this document records what we committed to. Read this, not the briefs, when you need to know what the slice runs on. A tent-pole item below is reopened only if an assumption or research finding it rests on proves false, and then by the lead as a numbered finding, not by a delegate working around it.

Source decisions are in [gtm-journal-01.md](./gtm-journal-01.md) (D11, D14 to D18, D20 to D27, D31) and [gtm-journal-02.md](./gtm-journal-02.md) (D42 onwards).

## The stack

| Concern | Committed choice | Decision | Not used |
|---|---|---|---|
| Hosting and SSR | Cloudflare Workers via `@cloudflare/vite-plugin`, React Router v8 framework mode, Mantine 9. The facade's deployment (`singology-facade`). | D17, D18, D19 | Vercel, Next.js, Edge Functions |
| Core data | Supabase Postgres, London (`eu-west-2`). Only the Worker talks to it, through Hyperdrive (caching disabled), with Drizzle ORM 0.45.x. RLS is the authority; every user-scoped query runs in a transaction setting `role authenticated` and `request.jwt.claims`. | D22 | PostgREST / Data API (disabled), browser-side queries |
| Auth | Supabase Auth, magic link, via `@supabase/ssr` in React Router middleware. Invite-only accounts in alpha. | D22, D47 | OAuth, passkeys (later), the facade's demo-role cookie |
| Video submissions and coach video replies | Bunny Stream: tus upload direct from the browser with a server-minted signature; HLS playback through our own player with CDN token authentication (path-based directory token). | D11, D20, D21 | Bunny iframe, Cloudflare Stream, Mux, Vimeo, YouTube |
| Audio submissions and coach audio replies | Bunny Storage behind Bunny's CDN, token-authenticated. The original file is kept untouched. | D21 | Stream re-encode of audio |
| Media processing | One job with ffmpeg (Cloudflare Container), triggered on upload completion: a browser-playable listening copy for audio, waveform peaks for audio and video. `jobs/media` is its prototype. | D21 | Browser-side decoding |
| Migrations | drizzle-kit 0.31.x, `out: supabase/migrations`, `supabase` prefix. Hand-written SQL via `generate --custom`. Never `drizzle-kit push` against a shared database. | D22 | drizzle-kit v1 (per-folder migrations break Supabase) |
| Transactional and nudge email | Resend, from the Worker. | D27, D43 | Supabase's built-in SMTP (team-only, 2 an hour) |
| Validation and types | Zod 4 in `packages/shared`; domain types are `z.infer`. | D27 | Hand-written parallel interfaces |
| Tests | Vitest; pgTAP for RLS policies; Playwright under `wrangler dev`. | D27, D33 | `vite preview` for e2e |
| Error tracking | Sentry on Workers. | D27 | |
| Non-production gating | Cloudflare Access with an email one-time-PIN allow-list, kept on the alpha deployment on top of Supabase Auth. | D17, D46 | |

## Boundaries

- **The browser** talks to the Worker (pages, actions, resource routes) and uploads media directly to Bunny with a signature the Worker minted. It never talks to Postgres.
- **The Worker** talks to Postgres (Hyperdrive), Bunny's API (create video, sign uploads and playback), Resend, and triggers the media job. Webhooks from Bunny land on Worker resource routes.
- **The media job** reads the uploaded original from Bunny, writes the listening copy and peaks back to Bunny Storage, and tells the Worker it is done.
- **Data access in the app** goes through the `Repositories` interface in `packages/db`. The slice adds the Drizzle implementation behind it; the fixture implementation stays for tests and the `/lab` pages.

## Alpha scope

The alpha exists so the founder and the CTO can use the real coaching loop end to end. It must prove these four functions, each with a written smoke test:

1. Video upload (student submission and coach reply).
2. Audio upload (student submission and coach reply).
3. Feedback annotation: timestamped comments on the waveform, the written summary, and next-exercise assignment, persisted and visible to the student.
4. Nudge emails: feedback-ready to the student, new-submission to the coach, and a practice reminder to a student with no submission in the week.

**Out of alpha** (D43): Stripe billing and Connect, in-page recording, native apps, Web Push, guardians and minors, the admin console, transposition. The schema names where billing and guardianship attach, but no code is written for them.

## Accounts and environments the user owns

Agents never create accounts or spend money. The user provisions these and puts secrets in `apps/web/.dev.vars` (ignored) and wrangler secrets:

- Supabase: one project in London for alpha. Branching comes with Pro and is a beta-stage concern.
- Bunny: one Stream library (originals kept, MP4 fallback on) and one Storage zone with a pull zone, token authentication enabled on both.
- Cloudflare: a Hyperdrive config created with caching disabled; Workers Paid if Containers need it; the Access policy already in place for the facade.
- Resend: a sending domain verified.

## Schema stability gate

Alpha permits migrations of any scale, including a reset of the alpha database. **The gate closes at the first beta account.** From then every migration is additive and data-preserving (D15, D43). The schema is designed in alpha as if that gate were already closed.
