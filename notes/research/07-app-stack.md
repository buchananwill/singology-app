---
title: "App stack: UI kit, media, data layer, state and repo layout"
type: research
status: draft
---

# App stack: UI kit, media, data layer, state and repo layout

Scoped by [gtm-proposal.md](../gtm-proposal.md) §5–§6 and decisions D8, D11, D12, D14–D18 in [gtm-journal-01.md](../gtm-journal-01.md). The fixed stack (React Router v8.4.0 framework mode on Workers, Supabase London, Bunny Stream, Stripe Connect, TypeScript strict) is not re-argued. All facts accessed 2026-09-23. Citations like [S1] point to [Sources](#sources). **Unverified** marks anything not confirmed against a primary source.

## Summary

1. **UI kit: keep Mantine (v9.6.2).** It is CSS-modules-only with no runtime CSS-in-JS, requires React ^19.2, has an official React Router framework-mode guide, ships monthly releases, and bundles the admin-heavy pieces (forms, dates, charts, notifications) that shadcn/ui makes you assemble. Chakra v3 still depends on Emotion, which is worse for streaming SSR on Workers.
2. **Waveform: wavesurfer.js 8.x (BSD-3), with pre-computed peaks from a server-side job.** It attaches to an existing `<video>`/`<audio>` element and skips fetch and decode when given `peaks` and `duration`. Compute peaks in a Cloudflare Container (ffmpeg) triggered by Bunny's "encoded" webhook, not in the browser.
3. **Slow-down: native `playbackRate` + `preservesPitch` is enough for the MVP.** It is Baseline (since Dec 2023) in every engine. Transposition is post-MVP; when it is needed, use Signalsmith Stretch (MIT, WASM). Rubber Band is GPL or paid; skip it. Yes, the CTO is overthinking it for the MVP.
4. **Playback and upload: own player on hls.js 1.7.3 (MSE and iOS 17.1+ MMS first, native HLS fallback); tus-js-client 4.3.1 direct to Bunny with a server-minted signature.** No Bunny iframe, no Uppy.
5. **Data: Drizzle through Hyperdrive, with every user query in an RLS transaction.** The browser never talks to Postgres. Authorisation lives in RLS (the authority) plus server checks. supabase-js only for Auth (`@supabase/ssr` 0.12.7). Pin drizzle-kit 0.31.x: the v1 RC's per-folder migrations break `supabase/migrations`. **Disable Hyperdrive query caching.**
6. **Client state: no global store by default.** Build the media player as a `useReducer` behind a context, and add `@xstate/store` only if it grows. If Zustand is used, apply three lint-enforced rules that prevent the loops.
7. **Repo: a pnpm workspace with `apps/web`, `packages/db`, `packages/shared` and `supabase/`.** No Turborepo or Nx. No Edge Functions. Capacitor cannot bundle the SSR app; it would need a separate SPA-mode build, and loading the remote URL carries App Review 4.2 risk.
8. **Gaps:** Resend for SMTP (the built-in sender does 2 emails an hour, team-only), Zod 4.6, a remote Supabase dev project on Windows, Sentry via `@sentry/cloudflare`, and the facade built on the same data-access interface with fixture adapters.

## 1. UI kit

**Mantine facts.**
- **Version and release activity:** current major is 9 (9.0.0 released 2026-03-31) [S1]. Latest is **9.6.2**, published about 2026-09-21. Patches ship roughly every 1–3 weeks (9.3.2 → 9.6.2 between June and September) [S2]. The releases page shows no year; I read the dates as 2026 (see Interpretations).
- **React:** `@mantine/core` 9.6.2 declares peer `react ^19.2.0` [S3], which matches the React 19.2.7 baseline.
- **SSR:** "All Mantine components use CSS modules for styling" [S4]. There is no runtime Emotion, so streaming SSR needs no style-injection plumbing. Mantine publishes a React Router framework-mode guide: `postcss-preset-mantine` plus `postcss-simple-vars`, `ColorSchemeScript` in `<head>`, and `MantineProvider` in the layout [S5].
- **Workers and Vite plugin:** I found **no reported issue** with Mantine CSS or PostCSS under `@cloudflare/vite-plugin` 1.58.0 (peer Vite ^6.1 || ^7 || ^8) [S6][S7]. CSS is resolved by Vite at build time, not by the Worker at runtime. **Unverified until a 30-minute spike renders one SSR page on `wrangler dev`.**
- **Agent-friendliness:** Mantine publishes `llms.txt` and `llms-full.txt` [S8]. There is no MCP server.

**Comparison, only on the criteria that matter here.**

| Criterion | Mantine 9 | shadcn/ui + Tailwind 4.3 | Chakra 3.37 |
|---|---|---|---|
| Media/admin-heavy UI | Tables, forms (`@mantine/form`), dates, charts, notifications, modals, `@mantine/schedule`: all first-party [S1] | Copy-in components on Base UI (the default since July 2026) or Radix [S9]; blocks for both [S10]. You own and maintain every file. | Good component set, but runtime Emotion (`@emotion/react` peer) [S11] |
| Brand theming | One theme object plus CSS variables; `defaultRadius` and fontWeights are theme-controlled [S1] | Strongest: you edit the source | Token system, good |
| Agent-friendliness | Stable API and llms.txt; agents learn one import surface | Best-known to agents; registry and MCP tooling [S12]. Copied source drifts per file. | Weakest: v2→v3 API churn pollutes training data |
| Maintenance | One dependency, monthly patches | Updates are re-copies or CLI diffs; `cn` package migration in Sept 2026 [S12] | Emotion dependency |

**Verdict: keep Mantine.** The reason: this product is mostly admin and media chrome (lists, forms, dialogs, date pickers, charts) around one custom surface (the waveform player). Mantine provides that chrome first-party without runtime CSS-in-JS. shadcn's advantage, pixel-level brand ownership, matters less here than not maintaining 40 copied components. The one custom surface is built by hand in either kit.

## 2. Waveform and annotation

**wavesurfer.js.**
- **Version and licence:** **8.0.0** is the npm `latest`, released 2026-09-23 (today). 7.12.12 was the last v7 backport [S13][S14]. Licence **BSD-3-Clause** [S14]. v8 rebuilds teardown on a single ownership model, and "most apps upgrade without code changes" [S13].
- **Plugins:** official plugins include Regions (loopable overlays and markers), Timeline, Minimap, Hover, Envelope, Record and Spectrogram [S15].
- **Existing element and pre-computed peaks:** the `media` option is "Use an existing media element instead of creating one", and `peaks` and `duration` are "Pre-computed audio data" and "Pre-computed audio duration". In source, supplying peaks "skips" the fetch path and bypasses decoding [S16]. So it can overlay a `<video>` fed by hls.js and never download or decode the file. Streaming is supported "only with pre-decoded peaks and duration" [S15].
- **React wrapper:** not needed. Use a thin `useWavesurfer` hook of our own; a `@wavesurfer/react` package exists but is **unverified** for v8.

**Alternatives.**
- **peaks.js 4.0.0:** LGPL-3.0, with active development moved to Codeberg [S17][S18]. It has points and segments, which suit comments. The LGPL obligations are manageable for a bundled web app but add a compliance chore. wavesurfer is more active and permissively licensed.
- **2026 alternatives:** I found no credible new alternative with comparable plugins (**unverified**; not exhaustively searched).

**Getting peaks.**
- **Server-side (recommended):**
  - The job is triggered by Bunny's encoding-complete webhook, arriving at a Worker resource route, then a Queue, then a **Cloudflare Container** (Workers Paid; `basic` is 1 GiB and `standard-1` is 4 GiB) [S19][S20]. The container runs ffmpeg to decode to mono PCM and writes min/max peaks JSON (about 20–50 points per second) to R2 or Storage.
  - BBC `audiowaveform` 1.10.2 is GPL-3.0 and reads MP3, WAV, FLAC, Ogg and Opus, **not AAC/M4A or MP4** [S21]. It would need an ffmpeg pre-step anyway, so ffmpeg alone is simpler.
  - Invoking a GPL CLI server-side is not distribution. Still, choose ffmpeg-only to avoid the question.
- **Client-side, rejected:** `decodeAudioData` on the student's file costs memory on long or large videos. Chrome and Firefox may not decode iOS Voice Memos **ALAC** (D16's recommended format; **unverified**). It also yields no peaks for files that finished uploading from another device.

**Recommendation:** wavesurfer.js 8.x (pin the exact version; 8.0.0 is one day old), with Regions and Timeline, `media` = our player element, and peaks from the server-side ffmpeg job. The facade uses fixture peaks JSON.

## 3. Slow-down and pitch

**Native.**
- **Support:** `preservesPitch` defaults to `true` and has been **Baseline since December 2023** (Chrome, Edge, Firefox, Safari including iOS, unprefixed) [S22].
- **Range limits:** Firefox mutes audio outside 0.25–4.0x [S23]. 0.5–0.75x is inside every engine's range.
- **Quality:** engines use different stretch algorithms. By recollection, Chrome uses WSOLA, Firefox uses SoundTouch and WebKit uses AVFoundation's time-pitch; all of this is **unverified**. WSOLA-style stretching at 0.5x produces audible "phasiness" on sustained vowels, which is acceptable for locating a problem and not hi-fi. **Add a 10-minute listening check at 0.5x and 0.75x on each engine to the phase-0 audio test.**

**Pitch-shift and transposition options.**

| Library | Version and licence | Delivery | Notes |
|---|---|---|---|
| Signalsmith Stretch | npm `signalsmith-stretch` 1.3.2, **MIT** [S24][S25] | WASM + AudioWorklet | Polyphonic, multi-octave pitch shift with formant compensation. Time-stretch is best between 0.75x and 1.5x [S24]. **Best choice.** |
| SoundTouchJS | `@soundtouchjs/audio-worklet` 2.1.1, **MPL-2.0** (relicensed from LGPL) [S26][S27] | AudioWorklet | Adequate; lower quality than Signalsmith for music (**unverified**, reputation-based) |
| Rubber Band | **GPL-2.0-or-later, or a paid commercial licence** (price not published on the page) [S28] | Community WASM builds (**unverified**) | Best-in-class, but GPL in a shipped web bundle forces GPL or a paid licence. Skip it. |
| Tone.js PitchShift | `tone` 15.1.22, MIT [S29] | Web Audio | Delay-line sawtooth shifter [S30]. Warbly on large intervals. Not for coaching-grade audio. |

**Gotcha for any Web Audio DSP:** routing a media element through `MediaElementAudioSourceNode` requires CORS headers on the Bunny pull zone. Otherwise the output is silent. Whether Safari routes *native-HLS* audio into Web Audio is **unverified**; hls.js on MMS avoids the question.

**Plain answer: no DSP beyond `preservesPitch` is needed for the MVP.** The core loop (coach slows a passage and loops it) is native. Transposing a backing track is a library feature. When it arrives, choose one of two options:
- (a) pre-render ±N semitone variants offline in the same Container job (Signalsmith C++ or its CLI), which needs zero client DSP; or
- (b) live transpose with Signalsmith's AudioWorklet.

(a) is simpler and plays on every device.

## 4. Playback and upload plumbing

**hls.js 1.7.3 (Apache-2.0) [S31].**
- The README recommends checking `Hls.isSupported()` **first**. iOS Safari 17.1+ is supported through ManagedMediaSource since 1.5.0. It advises native HLS only where MMS exists [S32].
- So native HLS is a fallback (older iOS), not the primary path. `playbackRate`/`preservesPitch` work on the same `<video>` element either way.

**Own player, not the Bunny iframe.**
- Owning the look is a requirement, and wavesurfer needs the media element in our DOM. A cross-origin iframe exposes neither.
- Direct URLs (HLS playlists, segments, MP4 fallback) are protected by **CDN token authentication** at the pull zone, not by the embed token [S33].
- Use **Token Authentication V2 with a path-based directory token**. The format is `…/bcdn_token=HS256-…&expires=…&token_path=%2F{videoId}%2F/{videoId}/playlist.m3u8`. It is HMAC-SHA256 over path, expiry and optional IP, then Base64URL [S34].
- This lets segment URLs inherit the token without player hooks. Mint it in a React Router resource route after an RLS-checked query; Workers' WebCrypto handles HMAC.

**Uploads.**
- **Bunny's flow** [S35]:
  1. Server creates the video object (Create Video API) to get a `videoId`.
  2. Server computes `AuthorizationSignature = SHA256(library_id + api_key + expiration_time + video_id)`.
  3. Client uploads to `https://video.bunnycdn.com/tusupload` with headers `AuthorizationSignature`, `AuthorizationExpire`, `VideoId` and `LibraryId`.
  4. The API key never leaves the server.
- **Library choice:** Bunny recommends tus-js-client [S35]. Use **tus-js-client 4.3.1** (MIT) [S36] behind a Mantine progress UI. **Uppy** (`@uppy/core` 6.0.1, MIT [S37]) adds a dashboard UI we would restyle anyway, plus a heavier dependency tree, for one file per assignment.
- **Gap:** Bunny's spec lists audio codecs (AAC, MP3, LPCM, FLAC, ALAC) and containers MP3, OGG and WAV but **not M4A**. It does not describe audio-only handling [S38]. Whether an audio-only Voice Memos `.m4a` is accepted and how it is encoded is **unverified**. It belongs in the D11 one-hour Bunny test, and it gates D14's audio-first default.

## 5. Data layer: Drizzle vs supabase-js

**(a) Drizzle + RLS.**
- **Schema helpers:** Drizzle declares policies in schema with `pgPolicy` and `pgTable.withRLS()`. `drizzle-orm/supabase` exports `anonRole`, `authenticatedRole`, `serviceRole`, `authUid` and `realtimeMessages` [S39]. `crudPolicy` lives in `drizzle-orm/neon`, not `drizzle-orm/supabase` [S39], so use `pgPolicy` directly.
- **RLS client pattern:** the documented pattern wraps each unit of work in `client.transaction(tx => …)`, first running `select set_config('request.jwt.claims', <claims>, TRUE)` and `set local role <role>` [S39].
- **Security fix:** the doc example string-interpolates `JSON.stringify(token)` into SQL. Our version must pass claims as a **bound parameter** and whitelist the role (`authenticated` or `anon`).

**(b) Connecting from Workers.**
- **Pooling:** Hyperdrive is a transaction-mode pooler, and "supports `SET` statements for the duration of a transaction or a query" [S40]. So `SET LOCAL` and `set_config(…, true)` inside our transaction work. Session-level `SET` must never be used.
- **Drivers:** `pg` ≥ 8.16.3 is recommended; postgres.js ≥ 3.4.5 is supported. `nodejs_compat` is default from compatibility date 2026-08-04 [S41].
- **Limits:** about 100 origin connections per config on Workers Paid, and 60 s per query [S42].
- **Which Supabase string:** Cloudflare says use Supabase's **Direct connection** string, not the pooled strings [S43]. Supabase direct is IPv6-only unless the IPv4 add-on is bought; the session pooler is the IPv4 alternative [S44]. Whether Hyperdrive reaches IPv6 origins is **unverified**; test it on day one.
- **Do not stack Hyperdrive on Supavisor transaction mode (6543).** That is double pooling, and Supavisor transaction mode rejects prepared statements.
- **Critical: create the Hyperdrive config with `--caching-disabled`.** Hyperdrive caches "eligible read-only query responses" [S45]. Under RLS, the result depends on session claims that are not in the query text. The docs do not say whether in-transaction queries are exempt. A cached `select * from submissions` could therefore leak across users.

**(c) Migrations.**
- **Stable drizzle-kit:** Drizzle's Supabase tutorial generates into `./supabase/migrations` [S46]. With `migrations: { prefix: 'supabase' }`, drizzle-kit 0.31.x emits Supabase-style `<timestamp>_name.sql` files [S47].
- **v1 breaks this:** the drizzle-kit **v1 beta/RC groups each migration into a folder** (`<ts>_name/migration.sql` + `snapshot.json`) [S48]. That breaks Supabase's flat-file expectation. Issue #5166 has been open since 2025-12-22 with no fix [S47].
- **Branching:** Supabase Branching runs the deployment workflow on every push. It applies pending migrations, then seeds (seeding must be enabled in `config.toml` for persistent branches), and deploys to production on merge [S49]. Per-branch cost is **unverified**.
- **Rules:**
  - drizzle-kit **0.31.x**, `out: supabase/migrations`, `prefix: 'supabase'`.
  - Hand-written SQL (grants, triggers, `auth` hooks, storage) goes in `drizzle-kit generate --custom` files.
  - Never run `drizzle-kit push` against Branching or production.

**(d) What still needs supabase-js.**
- **Auth:** `@supabase/ssr` **0.12.7** (supabase-js 2.117.1) [S50][S51]. Use `createServerClient` with `parseCookieHeader`/`serializeCookieHeader` getAll/setAll, as in Supabase's React Router example [S52]. Call it in v8 middleware (always on per D18), then call `getClaims()`, which "reads the access token from storage and verifies it" [S52]. Put the claims in router context for the RLS transaction.
- **Realtime:** not needed in the MVP. If added later, it is the one browser-side supabase-js use, and it is guarded by RLS on `realtime.messages` [S39].

**(e) Drizzle version.**
- Stable **drizzle-orm 0.45.3** and **drizzle-kit 0.31.11** were both released about 2026-09-21. **v1.0.0-rc.4** (2026-06-27) is not stable [S53][S54].
- Start on 0.45 and upgrade to v1 once it is stable and the Supabase migration layout is resolved.

**Verdict and architecture.**
- **Who talks to Postgres:** only the Worker. The browser never does. Loaders and actions call a `db` module in `packages/db`.
- **Two database clients:**
  - `userDb(claims)` runs everything inside the RLS transaction as `authenticated`.
  - `adminDb` (the `postgres` role, bypasses RLS) is used only in Stripe/Bunny webhooks and jobs. It is lint-restricted to `app/routes/api.webhooks.*` and job code.
- **Where authorisation lives:** in **both**. RLS is the authority, encoding D-rules such as "coach reads a submission only on an active enrolment". Server code performs intent checks and produces friendly errors.
- **Data API:** remove `public` from the Supabase Data API's exposed schemas. The publishable key is public, and nothing should use PostgREST (see Interpretations).
- **Portability:** the `pg_dump` exit path stands. Drizzle adds query portability but not auth portability.

## 6. Client state

**What is left.** With loaders and actions holding server state, what is left:
- **Media-player state:** playing, time, rate, loop region, selected comment.
- **Upload progress.**
- **UI toggles.**
All of it is page-local.

**Zustand 5.0.15** [S55]. It is fine, but the known loop causes are these:
1. **A selector that returns a new object or array** (`s => ({a: s.a, b: s.b})`). v5 follows React's `useSyncExternalStore` semantics, so a new reference each render gives "Maximum update depth exceeded". The fix is `useShallow` [S56].
2. **Calling `set` during render.**
3. **An effect that subscribes, or writes a value it also depends on**, e.g. `useEffect(() => set({t: media.currentTime}), [t])`.
4. **Feeding high-frequency `timeupdate` into a store that re-renders the tree.**

Rules prevent all four: selectors return primitives or use `useShallow`; no `set` in render; `react-hooks/exhaustive-deps` as an error; high-frequency time goes into a ref or a `useSyncExternalStore` read, not global state.

**Alternatives.**
- **Jotai 3.0.0** [S57]: atom sprawl, no benefit here.
- **XState 5.33.2 / `@xstate/store` 4.2.3** [S58][S59]: a full statechart is heavy for a player. `@xstate/store` is small, event-driven, and makes illegal transitions explicit.
- **`useReducer` + context:** zero dependencies, and agents rarely loop it because dispatch is stable.

**Recommendation: no global store.**
- **Player:** a typed `useReducer` in a `PlayerProvider` scoped to the review page. Events: `play`, `pause`, `seek`, `setRate`, `setLoop`, `mediaTime`. The wavesurfer and hls.js instances live in refs.
- **Upload progress:** local state.
- **If the player reducer outgrows about 10 events,** swap it for `@xstate/store` behind the same hook API.
- **Zustand** only if cross-route client state appears. So far none has.

## 7. Repo layout

```
singology-app/
  apps/web/            React Router v8 app (Worker): routes, UI, resource routes for webhooks/tokens
  packages/db/         Drizzle schema + RLS policies, userDb/adminDb factories, repositories
  packages/shared/     Zod schemas, DTO types, constants (tiers, roles)
  supabase/            config.toml, migrations/ (drizzle-kit output), seed.sql, tests/ (pgTAP)
  jobs/peaks/          Dockerfile + script for the Cloudflare Container (ffmpeg peaks; later transposition)
  pnpm-workspace.yaml
```

- **Edge Functions: not needed.** The Worker hosts:
  - Stripe webhooks (raw body available; use `constructEventAsync`);
  - the Bunny tus-signature and playback-token routes;
  - the Bunny webhook.
  Supabase Auth hooks can be Postgres functions. This amends [gtm-proposal.md](../gtm-proposal.md) §6 ("Edge Functions mint Bunny playback tokens") and the §5 repo line; see Interpretations.
- **Capacitor 8.5.2** [S60]:
  - `server.url` is "intended for use with live-reload servers. This is not intended for use in production" [S61]. The bundled `webDir` needs a static `index.html`.
  - A framework-mode SSR app cannot be bundled. The shell would need a second build of the same routes in SPA mode (`ssr: false`, `clientLoader`/`clientAction` only) [S62], calling the Worker over HTTP.
  - Loading the remote URL instead risks **Guideline 4.2** ("elevate it beyond a repackaged website") [S63], on top of the 3.1.1 risk noted in D8.
  - **Consequence now:** keep data access behind `packages/db` repositories exposed via resource routes, so an SPA build could reuse them. Do not build it yet.
- **Turborepo or Nx: not needed** at three packages. `pnpm -r` and `--filter` with TypeScript project references are enough. Revisit if CI exceeds about 5 minutes.
- **Windows:**
  - pnpm **12.6.0** (Node ≥ 18) [S64] and workspaces [S65] link via junctions on Windows (**unverified** detail; no caveats documented).
  - wrangler **4.137.0** needs Node ≥ 22 and pulls workerd 1.20260921.1 [S66]. Windows x64 workerd builds exist (**unverified** from this fetch).
  - `@cloudflare/vite-plugin` 1.58.0 peers wrangler ^4.137 [S6].

## 8. Gaps

- **Email:** Supabase's built-in SMTP delivers only to project team members, at **2 emails an hour** [S67]. Configure **Resend** or Postmark (both listed by Supabase) before any external user sees a magic link. Resend has a first-class Workers fetch API (**unverified** detail).
- **Validation:** **Zod 4.6.5** [S68] in `packages/shared`, used by action parsers and resource routes. Drizzle's Zod schema generator is optional; keep DTOs hand-authored.
- **Local dev:** `supabase start` needs Docker Desktop, Rancher Desktop or Podman on Windows [S69]. Recommend a **remote free-tier dev project** plus Branching, and skip the local stack unless offline work matters.
- **Testing:**
  - Vitest for units;
  - `@cloudflare/vitest-pool-workers` for Worker routes (**unverified** version);
  - **pgTAP RLS tests** via `supabase test db` against a branch;
  - Playwright as in [gtm-proposal.md](../gtm-proposal.md) §5.
  The RLS tests are the most important of these.
- **Error tracking:** Sentry's `@sentry/cloudflare` `wrapRequestHandler` (moved to the `/request` subpath in v11) wraps React Router's handler [S70][S71]. There is no dedicated "React Router on Workers" page, only Hydrogen's, so this is **unverified** for v8.
- **Facade to slice without a rewrite:**
  - Define repository interfaces in `packages/db` (`SubmissionRepo.listForCoach(…)`).
  - Loaders call `context.get(repos)`, provided by middleware.
  - The facade middleware injects fixture adapters (JSON plus fixture peaks and a public sample HLS). The slice swaps in Drizzle adapters.
  - Routes, components and Zod DTOs stay unchanged.
- **CORS on Bunny:** the pull zone must send CORS headers for wavesurfer and any Web Audio use (§3).

## Interpretations to confirm

1. **Years on GitHub release dates.** GitHub release pages showed month and day without a year (the fetch tool labelled them 2024). I read them as 2026 because Mantine 9.0.0 is dated 2026-03-31 and npm `latest` matches. The versions themselves are confirmed from npm.
2. **The Edge Functions line changes.** [gtm-proposal.md](../gtm-proposal.md) §6 says Edge Functions mint Bunny tokens. I recommend the Worker does it and that no Edge Functions exist. The lead should amend the proposal or overrule.
3. **Disabling the Supabase Data API.** I interpreted "the browser never talks to Postgres" as removing `public` from exposed schemas. This forecloses later browser-side supabase-js queries (Realtime Broadcast via `realtime.messages` is unaffected, **unverified**).
4. **Transposition is post-MVP.** The brief says coaches "may want" it. I treated it as a library feature, not part of the core review loop.
5. **Peaks job on Cloudflare Containers.** I assumed a Workers Paid-plan Container is acceptable; D17 assumes Workers Paid at pilot. Containers pricing was not researched.
6. **"Cloudflare's Vite plugin + Mantine works" is inferred** from the absence of reported issues, not tested.
7. **Audio-only uploads to Bunny** (§4) are unconfirmed and may affect D14. I did not work around this; it goes to the D11 test.

## Sources

All accessed 2026-09-23.

- [S1] Mantine 9.0.0 changelog: https://mantine.dev/changelog/9-0-0/
- [S2] Mantine releases: https://github.com/mantinedev/mantine/releases
- [S3] npm `@mantine/core`: https://registry.npmjs.org/@mantine/core/latest
- [S4] Mantine CSS modules: https://mantine.dev/styles/css-modules/
- [S5] Mantine React Router guide: https://mantine.dev/guides/react-router/
- [S6] npm `@cloudflare/vite-plugin`: https://registry.npmjs.org/@cloudflare/vite-plugin/latest
- [S7] Cloudflare React Router guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/
- [S8] Mantine llms index: https://mantine.dev/llms.txt
- [S9] shadcn/ui, Base UI default (July 2026): https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default
- [S10] shadcn/ui, blocks for Radix and Base UI: https://ui.shadcn.com/docs/changelog/2026-02-blocks
- [S11] npm `@chakra-ui/react`: https://registry.npmjs.org/@chakra-ui/react/latest
- [S12] shadcn/ui changelog: https://ui.shadcn.com/docs/changelog
- [S13] wavesurfer.js releases: https://github.com/katspaugh/wavesurfer.js/releases
- [S14] npm `wavesurfer.js`: https://registry.npmjs.org/wavesurfer.js/latest
- [S15] wavesurfer.js README: https://github.com/katspaugh/wavesurfer.js
- [S16] wavesurfer.js source (options): https://raw.githubusercontent.com/katspaugh/wavesurfer.js/main/src/wavesurfer.ts
- [S17] peaks.js: https://github.com/bbc/peaks.js
- [S18] npm `peaks.js`: https://registry.npmjs.org/peaks.js/latest
- [S19] Cloudflare Containers: https://developers.cloudflare.com/containers/
- [S20] Containers limits: https://developers.cloudflare.com/containers/platform-details/limits/
- [S21] audiowaveform: https://github.com/bbc/audiowaveform
- [S22] MDN `preservesPitch`: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/preservesPitch
- [S23] MDN `playbackRate`: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate
- [S24] Signalsmith Stretch: https://github.com/Signalsmith-Audio/signalsmith-stretch
- [S25] npm `signalsmith-stretch`: https://registry.npmjs.org/signalsmith-stretch/latest
- [S26] SoundTouchJS: https://github.com/cutterbl/SoundTouchJS
- [S27] npm `@soundtouchjs/audio-worklet`: https://registry.npmjs.org/@soundtouchjs/audio-worklet/latest
- [S28] Rubber Band licensing: https://breakfastquay.com/rubberband/license.html
- [S29] npm `tone`: https://registry.npmjs.org/tone/latest
- [S30] Tone.js PitchShift: https://tonejs.github.io/docs/15.1.22/classes/PitchShift.html
- [S31] npm `hls.js`: https://registry.npmjs.org/hls.js/latest
- [S32] hls.js README: https://github.com/video-dev/hls.js
- [S33] Bunny Stream security: https://bunny.net/docs/stream/security
- [S34] Bunny CDN advanced token authentication: https://bunny.net/docs/cdn/security/token-authentication/advanced
- [S35] Bunny tus resumable uploads: https://bunny.net/docs/reference/tus-resumable-uploads
- [S36] npm `tus-js-client`: https://registry.npmjs.org/tus-js-client/latest
- [S37] npm `@uppy/core`: https://registry.npmjs.org/@uppy/core/latest
- [S38] Bunny Stream video specification: https://bunny.net/docs/stream/video-specification
- [S39] Drizzle RLS: https://orm.drizzle.team/docs/rls
- [S40] How Hyperdrive works: https://developers.cloudflare.com/hyperdrive/configuration/how-hyperdrive-works/
- [S41] Hyperdrive, connect to Postgres: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/
- [S42] Hyperdrive limits: https://developers.cloudflare.com/hyperdrive/platform/limits/
- [S43] Hyperdrive + Supabase: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/
- [S44] Supabase, connecting to Postgres: https://supabase.com/docs/guides/database/connecting-to-postgres
- [S45] Hyperdrive query caching: https://developers.cloudflare.com/hyperdrive/concepts/query-caching/
- [S46] Drizzle with Supabase tutorial: https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
- [S47] drizzle-orm issue #5166: https://github.com/drizzle-team/drizzle-orm/issues/5166
- [S48] Drizzle v1 upgrade guide: https://orm.drizzle.team/docs/upgrade-v1
- [S49] Supabase Branching: https://supabase.com/docs/guides/deployment/branching
- [S50] npm `@supabase/ssr`: https://registry.npmjs.org/@supabase/ssr/latest
- [S51] npm `@supabase/supabase-js`: https://registry.npmjs.org/@supabase/supabase-js/latest
- [S52] Supabase SSR client (React Router): https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=react-router
- [S53] Drizzle releases: https://github.com/drizzle-team/drizzle-orm/releases
- [S54] npm `drizzle-orm`: https://registry.npmjs.org/drizzle-orm/latest
- [S55] npm `zustand`: https://registry.npmjs.org/zustand/latest
- [S56] Zustand v5 migration: https://github.com/pmndrs/zustand/blob/main/docs/reference/migrations/migrating-to-v5.md
- [S57] npm `jotai`: https://registry.npmjs.org/jotai/latest
- [S58] npm `xstate`: https://registry.npmjs.org/xstate/latest
- [S59] npm `@xstate/store`: https://registry.npmjs.org/@xstate/store/latest
- [S60] npm `@capacitor/core`: https://registry.npmjs.org/@capacitor/core/latest
- [S61] Capacitor config: https://capacitorjs.com/docs/config
- [S62] React Router SPA mode: https://reactrouter.com/how-to/spa
- [S63] App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- [S64] npm `pnpm`: https://registry.npmjs.org/pnpm/latest
- [S65] pnpm workspaces: https://pnpm.io/workspaces
- [S66] npm `wrangler`: https://registry.npmjs.org/wrangler/latest
- [S67] Supabase custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- [S68] Zod releases: https://github.com/colinhacks/zod/releases
- [S69] Supabase CLI getting started: https://supabase.com/docs/guides/local-development/cli/getting-started
- [S70] Sentry, Hydrogen with React Router on Cloudflare: https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hydrogen-react-router/
- [S71] Sentry Cloudflare v10→v11 migration: https://docs.sentry.io/platforms/javascript/guides/cloudflare/migration/v10-to-v11/
- [S72] React Router changelog (v8.4.0, 2026-09-15; v8.0.0, 2026-06-17): https://reactrouter.com/changelog
