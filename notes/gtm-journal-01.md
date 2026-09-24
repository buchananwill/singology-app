---
title: "Singology GTM Proposal: Session 1 Journal"
type: workflow
status: active
---

# Singology GTM Proposal: Session 1 Journal

**This is the head of the thread.** It is the first session of the arc; there is no predecessor. Decisions start at 1 and findings at F1.

## Reading order for a fresh context

1. [gtm-vision.md](./gtm-vision.md) in full. It is short and it is the yardstick.
2. §4 Next work and §5 Open items below.
3. Decisions, only the ones §4 cites.

Do not read the research briefs in [research/](./research/) end to end. Each opens with a summary; read that, and only go deeper when a decision cites a section.

## 1. The arc's charter

Produce a GTM proposal for an asynchronous singing-coaching platform (PT-style: exercise library, student self-recordings, coach feedback, tiered coach pricing). The proposal answers the CTO's four questions in the vision and adds product/competitive context. Deliverable: [gtm-proposal.md](./gtm-proposal.md). The plan is [gtm-plan.md](./gtm-plan.md).

## 2. State as at bootstrap

- Greenfield. `D:\coding\singology-app` holds only the voice note (`.ogg`) and its transcript. It is not a git repository. *(At bootstrap; a git repo was initialised later this session, see §3.)*
- No code, no tests. No notes existed before this session.

## 3. Operational manual

- Windows 11; PowerShell primary, Git Bash available. Global CLAUDE.md asks for small single-purpose shell calls and relative markdown links; delegates inherit this.
- A throwaway Whisper venv lives in the session scratchpad, not the repo. Nothing in the repo depends on it.
- Research briefs land in `notes/research/NN-<topic>.md`, one per work package.
- **Stopping local servers on Windows:** kill only the `node.exe` whose command line contains `singology-app`, plus the repo's `workerd.exe`. Many unrelated `node.exe` processes run on this machine (F12).
- **Git (from 2026-09-23):** a local repo on `main`, with no remote yet. `.gitattributes` forces LF (`* text=auto eol=lf`), overriding the machine's global CRLF conversion; keep it that way for the Workers/Linux toolchain. `.gitignore` excludes source audio (`*.ogg` and similar: the founder's voice is personal data, so only the transcript is tracked), `.playwright-mcp/` agent artefacts, secrets (`.env*`, `.dev.vars`), and future build output (`node_modules/`, `.wrangler/`, `.react-router/`).

## 4. Next work

- **The draft proposal is complete:** [gtm-proposal.md](./gtm-proposal.md), written 2026-09-23 from all five briefs (F1 to F9). It awaits the user's review.
- **MORNING SUMMARY (2026-09-24): the facade is complete on branch `facade`; not merged, not deployed.**
  - **Lead's verification on the final tree:**
    - `pnpm install --force --frozen-lockfile`, to undo any `node_modules` probe from the pitfall-11 diagnosis;
    - `pnpm test`: 105 pass;
    - `pnpm test:e2e`: 47 pass, 3 skipped by design, Chromium and WebKit, running under `wrangler dev` (D33);
    - screenshots of every route at 1280 and 375 px in `apps/web/test-results/screenshots/`, untracked; the lead reviewed the landing, student feedback and coach review screens;
    - nothing left running.
  - **For the founder reply (imminent pitfalls):** **none found that changes the product design or the stack.** Every pitfall was local tooling, a test-harness issue, or a small code fix. The one product-level lesson, that media needs Range-capable serving, is already satisfied by the chosen host (D21, D31).
  - **Still unproven, needing a real device:** native HLS playback, the upload panel's local preview (`blob:` playback) and the upload flow on **real iPhone Safari** (pitfalls 7 and 8). Deploy the facade behind Cloudflare Access and test on the used iPhone.
  - **Carried into the slice:**
    - TypeScript stays on 6 (D30);
    - e2e runs under `wrangler dev`, not `vite preview` (D33);
    - bundle chunks over 500 kB need code-splitting of the player before the beta (pitfall 13);
    - hydration discipline for dates and live clocks (D32, pitfalls 9 and 12).
  - **Deliberately not yet exercised:** Drizzle over Hyperdrive with RLS transactions, Bunny tus signatures and tokens, the Container job and Stripe Connect. The slice's first spikes should target these, in that order of risk.
  - **To show the founder:** (1) deploy (`wrangler deploy` from `apps/web`) and put the workers.dev route behind Cloudflare Access with an email PIN allow-list *before* sharing the URL; (2) consider asking the founder to record 2 or 3 of his own warm-ups to replace the synthetic tones. That's his own material, so copyright-clean, and far more convincing than test tones.
- **Overnight facade build (D29), done; see the summary above.** The contract is [facade-spec.md](./facade-spec.md). The stages run in sequence:
  - (1) scaffold and toolchain proof;
  - (2) media fixtures, peaks script and player component;
  - (3) fixtures and all surfaces;
  - (4) lead verification, Playwright screenshots and the pitfalls report.
  Pitfalls accumulate in `notes/facade-pitfalls.md`.
- **WP7 (app stack) returned and ruled 2026-09-23 as decisions 19 to 27.** See [07-app-stack.md](./research/07-app-stack.md). Next: facade work (D26) can start whenever the CTO chooses; it should begin with a planning-session decision spec. The CTO's near-term roadmap (facade, then legal/accounting, then vertical slice) is recorded in [gtm-plan.md](./gtm-plan.md).
- **Next session:** fold in the user's review comments and the founder's answers (§5). Then, if asked, turn launch-plan phase 0 (gates) and phase 1 (MVP) into a planning-session decision spec for the build. Phase 0 items are the iPhone audio test, the host audio test, and the accountant, solicitor and PRS enquiries.

## 5. Open items

- **Founder: adults only at launch?** (decision 13). Does the choir have under-18 members who would expect to join the pilot?
- ~~**CTO: what is the existing Android KMP app?**~~ *CLOSED 2026-09-23:* the user says it is a personal learning project, not part of this platform. WP3's assumption holds, and its stage-3 KMP option is dropped.
- **Accountant questions (F4, F6), urgent because the founder is VAT-registered:** is the platform principal or disclosed agent for other coaches' sales? Should it be a separate entity from the founder's VAT-registered business? Does the private-tuition exemption apply to singing coaching?
- **Founder questions from WP5:** choir size (sets the pilot size); whether the founder and standard prices are fixed platform tiers or coaches set their own; whether commission applies to the founder's own revenue.
- **"GTM" scope** (see decision 2): the proposal is weighted to the four technical/legal questions plus a product/competitive section. Pricing strategy and marketing channels are kept thin unless the user asks for more.

## Decisions

**1. Deliverable shape.** A single proposal document, [gtm-proposal.md](./gtm-proposal.md), synthesised by the lead from five delegated research briefs. Delegates research and write briefs; the lead adjudicates and writes the synthesis. *Reason:* the synthesis requires cross-brief adjudication (e.g. hosting choice affects copyright exposure and billing), which only the lead holds.

**2. Scope of "GTM".** The CTO's four questions are the spine. A fifth package covers product/UX and the competitive landscape, because the user named UX and a go-to-market proposal needs "who else does this". CI/CD is folded into WP3 (client stack). *Reason:* this matches the user's stated mix of infrastructure, UX, CI and legal without inventing a marketing workstream nobody asked for.

**3. Cost-model assumptions (authored, not observed).** Delegates use these exactly so their figures are comparable:
- Uploads: 0.5 h per student per week, 50 weeks, so **25 h per student per year** (the CTO's figure).
- Cohorts: **100, 1,000 and 10,000 students.**
- Quality tiers (video + audio, total): **480p at about 1.2 Mbps, 720p at about 2.5 Mbps, 1080p at about 5 Mbps**, plus an **audio-only tier at 128 kbps AAC/Opus**. Give GB per hour for each.
- Submission playback: each submitted hour is watched **2x** (coach review plus the student rewatching feedback).
- Exercise library: **20 h** of coach-authored content in total. Each student watches **1 h per week** of it.
- Storage: model both **retain everything for 12 months** and **90-day rolling retention**.
- Coach feedback videos: **0.25 h per student per week**, watched 1x.
*Reason:* the CTO's upload figure alone ignores egress from library playback and feedback, which on per-minute-delivered platforms dominates the bill. *ENDORSED by the user 2026-09-23:* they meant to include playback, and "bandwidth for coaches to watch submissions isn't free either." The 2x submission playback stands.

**4. Audio fidelity is a first-class requirement.** Every infrastructure and client brief must say whether its candidate re-encodes audio, at what bitrate, and whether mobile browsers apply voice processing (AGC, noise suppression, echo cancellation) that damages singing. *Reason:* the product sells vocal feedback; a pipeline tuned for talking heads could quietly ruin the core signal.

**5. Jurisdiction: UK primary, US secondary.** *CONFIRMED by the user 2026-09-23: "UK-based."* "Singology" and the founder's phrasing ("community choir", "PTs") suggest the UK. US law is covered because YouTube, Vimeo, Stripe and most hosts are US companies whose terms and DMCA procedures apply. *Reason:* legal research without a jurisdiction is worthless. This is an assumption; it is listed in §5 for the user to confirm.

**6. Safeguarding and minors are in scope for legal (WP2).** Community choirs commonly include under-18s. Video of minors, coach vetting (UK DBS checks) and parental consent change the auth and data design. *Reason:* the vision is silent on this, but it could force requirements on WP4 (consent records, age gating).

**7. App Store payment rules are a shared primitive between WP3 and WP4.** Both briefs must cover Apple/Google in-app purchase rules for coaching services (including Apple guideline 3.1.3(d) on person-to-person services and the 2025 US anti-steering changes), and each must say which answer it assumed. *Reason:* whether a native iOS app must use Apple's IAP is a large, hidden cost of the native path and a billing-design constraint. Two delegates meeting it separately would otherwise diverge.

**8. Billing shape (provisional, pending the founder's pricing answers).** **All purchases go through web Stripe Checkout on a Stripe Connect platform. There is one monthly subscription per student–coach pair, priced by the coach's tier and including a submission allowance, with the exercise library bundled.** Any native app is a login-only companion with no purchase UI. The platform never stores card data; it keeps Stripe customer, subscription and connected-account IDs mirrored from webhooks. *Reason:* F3 confirms the costs; this keeps us in PCI SAQ A scope and out of Apple's in-app purchase regime regardless of how 3.1.3(d) is read. The tier prices (£60/£35) and 20% commission in the WP4 brief are illustrative, not decided. *AMENDED 2026-09-23 (see F7):* the "login-only native companion" is **not** a safe harbour. Apple's 3.1.3(f) exemption lists VoIP/storage/email-type tools, and WP3 cites a December 2025 rejection of a login-only coaching companion under 3.1.1. The billing shape stands for the web. Any future native app needs its own App Review risk assessment before build, and budget for possibly adding IAP.

**9. Build and own; the pilot runs on our own MVP, not on CoachNow.** *User steer 2026-09-23:* the founder's choirs are well established and he has significant personal standing as a vocal coach, so he earns more by owning the platform than by adopting one. Agentic development has removed most of the build cost that made "buy" rational. **This rejects WP5's "don't build yet" recommendation (F1).** WP5's pilot design is kept, but reframed: its metrics (weekly submission rate ≥70%, median turnaround ≤72h, retention ≥80% at 4 weeks and ≥60% at 12, willingness to pay) become the **success measures of our own MVP pilot**, not a gate on whether to build. They still gate scaling beyond the choir. *ENDORSED by the user 2026-09-23, with their reason:* piloting on anyone else's tool imposes switching friction on the pilot cohort, "a recipe for chaos, and killing the platform at the worst moment." Their stance: "We make the big decisions right up front, we prototype competently, and the only question is how far and how fast we balance scale and features."

**15. The pilot MVP is production, not a throwaway prototype.** This follows from D9's endorsement: the pilot cohort must never be asked to switch. **The pilot cohort's accounts, subscriptions, submissions and history carry forward unchanged into every later phase.** Consequences:
- Schema changes after launch are forward-only migrations with data preserved.
- Stripe customers, subscriptions and connected accounts are created for real from day one (live mode; no test-mode pilot).
- Media asset IDs stay stable, so a host switch from Bunny to R2 (D11) must be a backend migration invisible to users.
- The architectural decisions (D8, D10 to D14) are fixed before phase 1 starts, not revisited during the pilot.
*Reason:* the user's switching-friction argument applies just as much to a rebuild of our own prototype as to leaving a bought tool. Scope may grow after the pilot; foundations may not be swapped under the cohort.

**16. Capture is upload-first; in-page recording is a convenience layer on top.** *Proposed by the user 2026-09-23; adopted.* **Every assignment accepts a file upload (audio or video) from the device's own recorder, and the MVP ships this path first.** In-page recording (MediaRecorder) is added only for platforms where the phase-0 test shows it is at least as clean as the native recorder. Each platform gets a "recommended recorder" guide:
- **iOS audio:** Voice Memos with Settings → Voice Memos → Audio Quality set to Lossless.
- **iOS video:** the Camera app, with recommended settings stated (resolution; Audio Mix left on Standard where the model has it; wind noise reduction off).
- **Android:** the device's own recorder in its highest-quality mode, or a named free app chosen in phase 0.
- **Advanced students:** a DAW or USB interface, then upload.

The file input omits `capture`, so iOS offers Photo Library, Camera and Files. The upload runs inside the assignment page, so the file links to its assignment automatically.

*Reason:* the upload pipeline (tus resumable to Bunny) is needed anyway for desktop, Android and external-mic users. Native recorders bypass WebKit's WebRTC voice-processing path entirely, and the upload route fully covers WP3 trigger T6 (external-mic demand) without native code.

**What it does not solve:** (a) sing-along with a guide track playing from our page while recording; (b) uploads continuing after the screen locks (WP3 T3); (c) iOS photo-picker transcoding or multi-GB HEVC originals (WP3 §2.6).

**Amends WP3's verdict order:** WP3 made in-page recording the default path, with `<input capture>` as the fallback. That order is now reversed.

**Additions to the phase-0 test script:**
- Voice Memos Lossless and Camera app output, compared against a reference recording.
- Whether background audio from Music or Safari keeps playing, and is routed to headphones, while Voice Memos or Camera records. This decides whether "play the track on this phone, record on this phone" works at all.
- Whether picking a video from Photos triggers transcoding.
- File sizes per 5 minutes at the recommended settings.

**17. Frontend hosting: Cloudflare Workers (static assets plus SSR), with a framework that runs natively on Workers. Cloudflare Access (email one-time PIN) gates every non-production surface.** *The user has no strong host preference; ruling by the lead, 2026-09-23.*
- **Agentic access is not the differentiator.** Both have first-class CLIs (`vercel`, `wrangler`), official MCP servers and preview deploys per branch.
- **The differentiator is gating non-production surfaces for people outside the team.** On Vercel, free protection (Vercel Authentication) admits only Vercel team members. Password Protection is $20/month per project on Pro and is unavailable on Hobby. Identity-provider protection (Passport) and Trusted IPs are Enterprise-only (verified against vercel.com/docs/deployment-protection, updated 2026-09-15). Cloudflare Access sends a one-time PIN to any email on an allow-list (verified against developers.cloudflare.com one-time-pin docs). Its free Zero Trust tier covers up to 50 users (the lead's understanding, **not re-verified** this session).
- **Other factors:** Vercel Hobby prohibits commercial use, so Vercel means Pro at $20 per seat per month. Workers Paid is $5/month. R2, the D11 fallback, lives on the same account and bindings.
- **The cost of choosing Cloudflare:** Next.js runs there only through the OpenNext adapter, a known source of edge cases. **So: pick a framework that deploys to Workers natively (e.g. React Router v7, SvelteKit, Astro, Hono plus a SPA). Do not pick Next.js on Cloudflare.**
- **Flip condition:** if the CTO wants Next.js specifically, use Vercel Pro and accept team-only preview gating plus shareable preview links.
- **Access never protects the production app,** which has its own Supabase Auth (D8). Access covers previews, staging and admin tooling only, so the founder and coaches can review builds before the pilot without Vercel seats.

*CONFIRMED by the user 2026-09-23:* the Vercel commercial-use ban "settles it"; Cloudflare lets a mock-up run without the founder fronting any capital. The user is not tied to Next.js. **Their hard rule: the stack must be TypeScript-first.**

**18. Frontend framework: React Router ~~v7~~ v8 in framework mode, TypeScript strict, deployed to Cloudflare Workers.** *AMENDED 2026-09-23, corrected by the user:* React Router is on v8. The lead verified this against reactrouter.com/changelog: **v8.4.0, released 2026-09-15.**
- **v8 facts that bind the build:** the old React Router Cloudflare dev proxy is removed; deploy through `@cloudflare/vite-plugin` only. `react-router-dom` is gone; import from `react-router` and `react-router/dom`. Middleware is always on (use it for the Supabase session check). Split route modules are the default.
- **Baseline:** Node 22.22+, React 19.2.7+, Vite 7+, TypeScript 6.
- **Warning for briefs:** agents trained on v7 patterns will reach for `react-router-dom` and the v7 Cloudflare proxy. Every implementation brief must state "React Router v8" and these import rules.
- The rest of the ruling stands. *Lead's ruling 2026-09-23 within the user's TypeScript-first rule; the CTO may override. SvelteKit is the acceptable alternative.*
- It is TypeScript-first, with generated route types.
- It deploys to Workers natively through Cloudflare's own Vite plugin and templates, with no adapter layer (see D17's OpenNext concern).
- **SSR** covers the public surfaces (landing page, coach cards). **Client-side** handles the authenticated app.
- React has the densest ecosystem for what the product needs: Supabase and Stripe client examples, waveform and media components (e.g. wavesurfer.js), and agent familiarity.
*Reason:* the user left the choice open. The lead rules so phase 1 does not stall on it, and picks the option with the least integration surface on the chosen host.

**19. UI kit: Mantine 9.x** (the CTO's default, confirmed by WP7). The lead verified 9.6.2, released 2026-09-01, on mantine.dev. It uses plain CSS modules with no runtime CSS-in-JS, so SSR on Workers needs no extra setup. It ships forms, dates, charts and notifications, which the coach/admin surfaces need. Theming covers the founder's brand. *Not verified:* a running build with `@cloudflare/vite-plugin`; the first facade commit proves it.

**20. Media UI libraries.**
- **Waveform:** wavesurfer.js 8.x (BSD), attached to our own media element, rendering **pre-computed peaks** (never decoding whole files in the browser). The Regions plugin handles timestamped comments and loops.
- **Streaming:** hls.js for HLS, with Safari's native HLS as the fallback.
- **Slow-down:** the browser's built-in `playbackRate` with `preservesPitch`. **No DSP library in the MVP.**
- **Transposition** (post-MVP): Signalsmith Stretch (MIT). Rubber Band is excluded (GPL or commercial licence).
- **Uploads:** tus-js-client, with a server-minted Bunny signature. No Uppy.
- **Player:** our own, never the Bunny iframe (D11 requires owning the look).
*The CTO asked whether they were overthinking DSP: yes, for the MVP.*

**21. Media pipeline: audio and video take different routes, with one processing job.** WP7 could not confirm that Bunny Stream accepts audio-only uploads, and the lead couldn't either (Bunny's formats page 404s). Separately, iPhone Voice Memos "Lossless" produces **ALAC**, which only Safari plays.
- **Video submissions** go to Bunny Stream (D11).
- **Audio submissions** upload to Bunny Storage (the plain file store behind Bunny's CDN, token-authenticated). The original is kept as-is, and there is no Stream re-encode.
- **A processing job** runs in a Cloudflare Container with ffmpeg, triggered on upload completion (Bunny webhook, or our upload-complete route). For every submission it (a) writes a browser-playable listening copy (AAC 256 kbps, or Opus) for audio and (b) computes waveform peaks for both audio and video.
*Reason:* this removes the unconfirmed Stream dependency, keeps the original audio untouched (D4; better than any host re-encode), and gives D12's audio archive for free on the audio path.
*Unverified:* Containers pricing and whether Workers Paid covers them. Check before the slice. **The facade needs none of this** (fixture peaks and files).

**22. Data layer: Drizzle on the server only; RLS remains the authority.**
- **Only the Worker talks to Postgres,** through Hyperdrive, with Drizzle ORM (0.45.x). The browser never talks to Postgres, and **Supabase's Data API (PostgREST) is disabled.**
- **Every user-scoped query runs in a transaction** that sets `role authenticated` and `request.jwt.claims` (Drizzle's Supabase RLS pattern), so RLS policies (declared in the Drizzle schema with `pgPolicy`) enforce access. Server code adds checks on top. An `adminDb` without claims is used only by webhooks and jobs.
- **Hyperdrive query caching is disabled.** The lead verified that caching is on by default, and the docs don't say whether cached reads account for the session's role or claims. A cached read could serve one user's rows to another.
- **drizzle-kit pinned to 0.31.x,** with `out: supabase/migrations` and the `supabase` prefix, so Supabase Branching applies the flat SQL files. The lead verified drizzle-orm issue #5166: the v1 beta writes per-folder migrations, which break Supabase. It has been open since 2025-12-22. **Do not upgrade to drizzle-kit v1 until it is fixed. Never run `drizzle-kit push` against Branching or production.**
- **supabase-js** (`@supabase/ssr`) is used only for Auth sessions (cookies, in React Router v8 middleware).
*This endorses the CTO's Drizzle lean,* with the portability escape hatch intact. *It amends the WP4 assumption* that the browser queries Supabase directly under RLS.

**23. No Supabase Edge Functions.** The Worker hosts the Stripe webhook (`constructEventAsync` on the raw body), the Bunny tus-signature, playback-token and webhook routes, and job triggers, all as React Router resource routes. Auth hooks, if needed, are Postgres functions. *Amends proposal §6* ("Edge Functions mint Bunny playback tokens") and the §5 repo line.

**24. Client state: no global store.** Server state lives in React Router loaders and actions.
- **Player:** a typed `useReducer` in a `PlayerProvider` scoped to the review page, with events `play`, `pause`, `seek`, `setRate`, `setLoop` and `mediaTime`. The wavesurfer and hls.js instances live in refs. **High-frequency `timeupdate` never goes into React state:** use a ref or a `useSyncExternalStore` read.
- **Upload progress:** local state.
- **If the player reducer outgrows about 10 events,** swap it for `@xstate/store` behind the same hook.
- **Zustand (the CTO's usual choice)** only if cross-route client state appears, and then under four rules: (a) selectors return primitives or use `useShallow`; (b) no `set` during render; (c) `react-hooks/exhaustive-deps` is an error; (d) no high-frequency media time in the store. These rules target the recursive-update loops the CTO has seen agents cause.

**25. Repo layout: a pnpm workspace, no Turborepo or Nx.**
- `apps/web`: the React Router v8 Worker (routes, UI, resource routes).
- `packages/db`: the Drizzle schema, RLS policies, `userDb`/`adminDb` factories and repositories.
- `packages/shared`: Zod 4 schemas, DTO types, and constants (tiers, roles).
- `supabase/`: `config.toml`, `migrations/` (drizzle-kit output), `seed.sql`, and `tests/` (pgTAP RLS tests).
- `jobs/media/`: the Dockerfile and ffmpeg script for the D21 Container.
**A future Capacitor shell can't bundle a framework-mode SSR app.** It would need a second SPA build of the same routes calling the Worker over HTTP; loading the remote URL invites Apple guideline 4.2 rejection. **Standing rule:** data access stays behind `packages/db` repositories, exposed via loaders or resource routes, so that option stays open. Do not build it now.

**26. The facade is the real app on fixtures.** Roadmap step 1 is a founder-facing facade with no real users or payments. It is **`apps/web` itself**:
- the real routes and Mantine UI;
- loaders reading **fixtures through the same repository interface** `packages/db` will implement, so the slice swaps implementations, not routes;
- sample audio and video served as static assets with pre-computed peaks;
- no Supabase, Stripe, Bunny or Container.
It deploys to Workers (free) behind Cloudflare Access with an email-PIN allow-list (D17). *Reason:* D15 says foundations are never swapped under a cohort. The facade has no cohort, but its UI must survive into the slice, or the founder's sign-off on the vision is sign-off on a throwaway.

**27. Slice-stage supporting choices:**
- **Transactional email:** Resend (or Postmark), configured before any external user sees a magic link. Supabase's built-in SMTP sends only to team members, 2 emails an hour.
- **Validation:** Zod 4.x in `packages/shared`.
- **Dev database:** a remote free-tier Supabase dev project plus Branching. No local Docker stack on Windows.
- **Tests:** pgTAP for RLS policies; Vitest; Playwright.
- **Error tracking:** Sentry on Workers.
- **Pilot metrics** (WP5 thresholds): an `events` table written from day one of the slice, since the data can't be backfilled.
- ~~**The iPhone audio test** (D16) runs before the slice, not before the facade.~~ *STRUCK 2026-09-23 by D28.*

**28. The upload path's audio quality is trusted; no fidelity gate before the slice.** *User steer 2026-09-23 ("be bold"); the lead agrees on the merits.*
- **Why the risk is low:** the fidelity risk in WP3 lived almost entirely in **in-page recording**: WebKit's WebRTC voice processing and audio routing. The upload path (D16) uses Apple's own recorders, which never touch that stack, and D21 keeps the original file untouched. Musicians record on Voice Memos and the Camera app routinely. **That residual risk is accepted.**
- **Workflow risks that remain** (not fidelity; the beta circle surfaces them, not a pre-slice gate):
  - (a) whether a backing track can play from the same phone while Voice Memos or Camera records; the fallback is a second device;
  - (b) Camera or Voice Memos processing options (Audio Mix, wind reduction, Enhance Recording), handled by the recommended-settings guide;
  - (c) clipping when singing loudly close to the mic, handled by distance guidance in the guide;
  - (d) photo-picker transcoding and large files in a foreground upload.
- **In-page recording** is not in the slice. If it is ever built, WP3's fidelity test and trigger T1 apply to it then.
- **The CTO's used iPhone** becomes a dev device for normal Safari QA, not a test gate.
*Amends* D16's phase-0 test additions, D27's last bullet, and proposal §7 phase 0.

**29. Overnight facade build (user, 2026-09-23).** The CTO wants to reply to the founder the next day knowing whether there are real imminent pitfalls.
- **Scope:** landing page with coach cards, the student surfaces and the coach surfaces. No admin or founder console.
- **Git:** work on branch `facade`; `main` stays untouched until the user reviews. **Commit regularly: many small, focused commits** (the user's standing preference; every delegate brief repeats it).
- **Deploy:** local only. The user may already be logged in to wrangler, but a workers.dev URL is public until Cloudflare Access is configured, so the lead does not deploy. Verification is local: dev server, production build, the Workers runtime via `wrangler dev`, and browser screenshots.
- **Deliverables by morning:** the facade (D26), plus a pitfalls report the CTO can use in their reply to the founder.
- **Toolchain as measured:** Node v24.6.0; pnpm 9.12.1 (pinned in `packageManager`, the global install left alone).

**30. TypeScript is pinned to `~6.0.3` until typescript-eslint supports 7.** npm `latest` is TypeScript 7.0.2, but typescript-eslint 8.70.1 peers `<6.1.0` (facade pitfall 1). This matches D18's TS 6 baseline. Revisit when typescript-eslint ships TS 7 support.

**31. Media must be served by something that honours HTTP Range. In the slice, that is always Bunny's CDN; in the facade, it is a Range-aware Worker route.** Facade pitfall 6: the local Workers assets handler (miniflare) returns `200` with the full body for `Range: bytes=0-99`. Chromium then can't seek into unbuffered media, so comment clicks and loops snap back to 0. Safari requires Range for video. Cloudflare's static-assets docs are silent on Range in production (the lead checked 2026-09-23). **The product is unaffected:** under D21, media in the slice never touches Workers static assets. **Facade fix:** a resource route serves `/media/*` by reading the asset through the `ASSETS` binding and answering `Range` with `206` plus `Content-Range` and `Accept-Ranges: bytes`. It runs before the static handler for that path (e.g. wrangler `assets.run_worker_first` for `/media/*`, verified against current docs). The Playwright seek test is tightened to assert the **completed** seek in Chromium. **Standing rule:** any future media-serving code path is checked with a `Range` curl before it is accepted.

**32. Fixture times are relative to the request's "now", so the demo never goes stale.** WP 3a used fixed fixture dates, so the stage 3b coach queue would show every item as overdue against the 72-hour SLA. That is a bad first impression for the founder, and it would worsen every day the facade is live. The rules:
- **Fixtures store offsets** (e.g. "submitted 26 hours ago").
- **`createFixtureRepositories({ now })`** resolves them to absolute timestamps. Root middleware passes the request time, and the slice's Drizzle repositories take the same argument shape and ignore it.
- **The server renders all times and countdowns from loader data.** A live-ticking countdown may update only after hydration, through `useSyncExternalStore` on a clock source, never `setState` in an effect (lint D24). Its server-rendered text must equal the first client render.
- **Dates keep 3a's hand-rolled UTC formatting** (hydration-safe).
*Reason:* a demo that reads "overdue" everywhere undermines the product story the facade exists to show.

**33. e2e runs against `wrangler dev` on the built output, not `vite preview`.** Facade pitfall 11 was diagnosed as a local tooling fault (classification B), not our code. `vite preview`'s Node proxy opens a fresh socket to workerd for every request and leaves it in TIME_WAIT: 200 of 200 sequential requests did so, whether static assets, SSR or media, while `wrangler dev` left 0. One stressed run leaves about 5,800 such sockets against Windows' 16,384 ephemeral ports, so back-to-back runs fail with `connect EADDRINUSE`, which surfaces as `fetch failed`. The failing URLs were mostly `/assets/*.js`, which never reach our Worker, and a 256-way concurrency load test had 0 failures. With the webServer on `wrangler dev`, 7 of 7 back-to-back stressed runs passed 94/94 (commits `b40f0be`, `5f252e2`). This still exercises the Workers runtime, which is the intent of spec decision 25, amended in place. **It does not affect production, the demo or the slice.** Its only lesson for the slice's CI is to use `wrangler dev`, not `vite preview`, for e2e. *Unproven and accepted:* why the proxy doesn't pool connections.

**34. The project gets its own style-and-decomposition reviewer:** [.claude/agents/singology-style-decomposition-reviewer.md](../.claude/agents/singology-style-decomposition-reviewer.md). *User request 2026-09-24:* keep the principles of the user's `ue-style-decomposition-reviewer` and swap the C++/UE specifics for TypeScript, SQL and this project.
- **Kept verbatim in spirit:** the low-entropy principle and its five axes; the canon, plus Codd's normalisation; the "comments are entropy" rules; mandate discipline; the output schema; and fix-cycle verification.
- **Remapped:**
  - UE lifetimes (GC, UPROPERTY ownership) become request scope, React component lifetime, and the Workers isolate, where module scope outlives the request;
  - include fan-out becomes import fan-out plus workspace-package levelization (shared → db → apps/jobs, no deep imports);
  - hot-loop layering becomes typed arrays in the peaks and range code, plus N+1 queries;
  - clang-format becomes "no formatter configured, so one NOTE".
- **The House Rules encode D18 to D27, D31 and D32** (React Router v8 imports; repositories-only data access; Zod-validated actions; no global store; hydration-safe time; Mantine conventions; Drizzle as the schema source with generated migrations; one form for user-scoped versus privileged DB access). It explicitly defers type-surface and hook-discipline findings to the sibling `typescript-type-reviewer` and `react-quality-reviewer`.
- **Observed gap:** the repo has no formatter (Prettier or Biome) configured; the reviewer will raise that once as a NOTE.

**35. Language target is ES2023, not ES2024.** Style review B11 proposes `Map.groupBy` and `toSorted` with `lib: ES2024`. `toSorted`, `toReversed`, `findLast` and friends are ES2023 and ship in iOS Safari 16 and later. `Map.groupBy` needs Safari 17.4, and choir members are likely to own older iPhones. **Rule: `lib: ES2023`; use `toSorted` and the other ES2023 array methods freely; grouping goes through one small `groupBy` helper in `packages/shared`,** a named facility and not a hand-rolled loop per call site. Revisit when analytics show the iOS version spread.

**36. Adopt Prettier** (style review N2: there's no formatter, and layout already varies). Prettier with defaults, plus `eslint-config-prettier` so lint and format don't fight. It lands as **one format-only commit** before the review fixes, so every later diff is semantic. *Reason:* layout becomes machine-owned, which is exactly what the reviewer's "Formatting Is Not a Finding" rule assumes.

**37. Review fixes: three reviewers ran over `main..facade` (2026-09-24); the fixes land in waves.** The lead spot-checked style B1 (forked `formatTime`), B9 (the ownership check duplicated in two forms) and B19 (the "spec decision 31" citation is wrong: the spec ends at 29). **All three were confirmed.**
- **Wave 0, tooling:** D36 Prettier, then D35 `lib: ES2023`.
- **Wave 1, the data seam** (it matters most for the slice):
  - style B9: ownership-scoped getters `submissions.getForStudent` and `getForCoach`;
  - style B10, trimmed: `library.getMany`, `media.getMany`, `feedback.forSubmissionWithComments`, `submissions.queueViewForCoach`, `coaches.listWithOffers`. **No further view methods without a loader that needs them;**
  - style B7 and B8: `ActionResult<T>`, one `parseInput`, and one discriminated-union action on the review route;
  - style B2 and B3 (one turnaround source; `submissionsPerPeriod` rendered, not hard-coded).
- **Wave 2, player and components:**
  - React B1: extract a `useWaveformInstance` hook from `WaveformPlayer`;
  - style B1 (use `formatTimestamp`) and B15 (theme colours in the waveform);
  - style N5 and React N4 / type B1: a shared `StandalonePlayer` replaces the five inline `PlayerProvider` + `WaveformPlayer` wraps;
  - React N1 and N2 (`useAbTransport`, `useUploadPanel`) and style N3 (`useActionNotification`);
  - style N4: the review page uses `useNow`;
  - React B2, B3, B4 and N3 (named and exported props, informative generic names).
- **Wave 3, consistency and hygiene:** style B4, B5, B6, B11 (under D35), B12 (`href()` if React Router v8 exports it; verify), B13, B14, B16, B17, B18 and B19 (comments: remove spec and decision numbers from source), N6 and N7; type B2 (`DemoRole` in the e2e helpers).
- **Not taken:** style N8, which is superseded by B9. React N6: keep React Router's scaffolded `Layout` signature.
- **The contract for the waves is [facade-review-fixes.md](./facade-review-fixes.md),** on branch `facade-review-fixes` (off `facade`, so the deployed version stays the reviewed one). It names the shared primitives up front, applying the F16 lesson. The one deliberate visible change: the turnaround is shown in days everywhere, and the review count is rendered from data.
- **Behaviour must not change.** After each wave: `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm test:e2e` all pass, and the lead re-runs the style reviewer on the fix range (fix-cycle verification).

**38. One rule for request encoding:** a native `<Form>` posts form data, parsed with `Schema.safeParse(Object.fromEntries(formData))`; fetcher submissions post JSON, read with one `readJson(request)` helper. It's stated once, as a module comment in `apps/web/app/lib/actionResult.ts`. *Reason:* Wave 1 made the review action JSON-only (S-B8), so two encodings now legitimately coexist. The fix-cycle review (FC-N2) rightly asked for the split to be marked rather than left implicit.

**39. Standing brief rule: no JSDoc that restates a name, type or signature.** Both review cycles found delegates adding reflexive JSDoc (S-B19, then FC-B5 with about 15 new blocks). From now on, every implementation brief says so explicitly: JSDoc only for a contract the type cannot state, one sentence.

**Bootstrapping cost (for D17's zero-capital point; the lead's understanding, not re-verified this session):**
- **Mock-up stage (about £0):** Workers Free, Supabase Free (projects pause after about a week of inactivity; no Branching), Bunny's $1 monthly minimum, and Stripe (no fixed fee).
- **Pilot-ready (about $30/month plus a domain):** Workers Paid ($5) and Supabase Pro ($25, needed for Branching, no pausing, backups and London hosting), plus usage-based Bunny.

**10. YouTube is ruled out as the video backend.** YouTube API Services Developer Policies III.F.3.a: "API Clients must not charge users to watch content in an embedded YouTube player." The lead verified this verbatim on 2026-09-23. Unlisted embeds also can't be access-controlled. *Reason:* a paid platform whose library and feedback play through YouTube embeds breaches this directly. Vimeo, the purpose-built hosts and DIY await WP1.

**11. Video host: Bunny Stream primary; Cloudflare R2 plus our own pipeline as fallback.** Bunny has per-GB pricing, free encoding, token-authenticated playback and no player branding. Cloudflare Stream and Mux bill per stored minute, which makes them 10 to 20 times dearer with long retention (F9). Vimeo reaches its bandwidth threshold at about 1,000 students and has unsettled ownership. YouTube is out (decision 10). **Gate:** before committing, run the one-hour audio test from WP1 on Bunny and R2. Upload a sung reference through each pipeline and compare the audio (spectrum and listening) against the original. *Fallback trigger:* Bunny's encoder damages audio, or its queue delays feedback turnaround.

**12. Retention: tiered, not flat.** **Full-quality video is kept 90 days after feedback is given; after that, only the audio track (128 kbps or better) is kept for the life of the account.** It is deleted on account closure or erasure request. *Reason:* F9 shows retention is the largest cost lever: 12 months costs about 2.5 times as much as 90 days at 1,000 students. WP5's differentiators (a progress timeline, A/B comparison with earlier weeks) need history, but singing progress lives in the audio. An audio archive of 25k hours at 0.0576 GB/h is about 1.4 TB, roughly $14/month on Bunny storage. This also gives a clean UK GDPR storage-limitation story (WP2). Coaches are told that video older than 90 days is audio-only.

**13. Adults only (18+) at launch; under-18s are a later phase with their own gate.** *Provisional: the founder should confirm; see §5.* Admitting minors brings the Children's Code, a DPIA with child-specific risks, guardian-linked accounts, enhanced DBS with barred-list checks for every coach, and open solicitor questions on regulated activity (WP2 R6, R8; solicitor questions 9 and 10). None of this is needed to prove the adult loop. The data model keeps the `guardianships` and `consent_records` tables from WP4, so adding minors later is not a migration. *Reason:* this removes the only severe-impact risk (R8) from launch without closing the door.

**14. Audio-first submissions; video per assignment.** Each assignment says whether video is required (e.g. posture or jaw work) or audio-only. The default is audio-only. *Reason:* WP5 puts audio-first capture at the top of its singing-specific flows. Audio costs about 1/20 of 720p on per-GB hosts (WP1 tables), so the 720p figures become a ceiling, not an expectation. Audio-only also sidesteps most of the iOS camera and upload-size concerns in WP3. The iOS fidelity test (WP3 T1) applies to both modes.

## Findings

**F1. WP5 returned: don't build yet; pilot on an existing tool first.** [05-product-landscape.md](./research/05-product-landscape.md) recommends a 12-week, 12–15-member pilot on CoachNow PRO ($49.99/month per coach), with payment through Stripe Payment Links, before any build. The build thresholds it sets: at least a 70% weekly submission rate, median turnaround of 72 hours or less, and at least 60% retention at 12 weeks. *Evidence:* the lead re-fetched coachnow.com/pricing on 2026-09-23. PRO is $49.99/month or $499/year; Academy is $89.99/month or $899/year and includes Stripe Connect billing and multi-coach pricing. **The brief's figures are confirmed.**

**F2. The closest competitor is Pronto Me (async, per-submission, named coaches at their own prices); the brief's price range is slightly off.** The lead re-fetched pronto.me/vocal-coaches-feedback: vocal coaches charge **$17–30 per submission** with 12 hour to 2 day turnaround. The brief says $15–45, which is probably site-wide across acting and dance. The conclusions (per-coach pricing precedent; founder premium of about 1.7–2×) still hold on the narrower range, which spans about 1.8×. The proposal cites $17–30.

**F3. WP4 returned: own the core DB (confirmed), Supabase Pro in London, Stripe Connect marketplace.** [04-backend-auth-billing.md](./research/04-backend-auth-billing.md). The lead re-fetched both pricing pages on 2026-09-23. **Supabase Pro** is $25/month with 100k MAU, 8 GB disk, 100 GB storage and 250 GB egress included; storage overage is $0.0213/GB and egress overage is $0.09/GB. **Stripe Connect UK, where the platform handles pricing,** costs £2 per monthly active account plus 0.25% + 10p per payout. **Both confirmed.** The claim of about $25/month flat up to 10k students holds only while video bytes live on the video host, not in Supabase Storage. WP1's DIY-on-Supabase costing must be read with the $0.09/GB egress in mind.

**F4. VAT structure is the largest financial risk in the model.** If the platform sells coaching as principal, VAT is due on the full gross once turnover passes the £90k threshold, which would consume a 20% commission. As disclosed agent for the coaches, only the commission is the platform's supply. Whether singing tuition qualifies for the private-tuition exemption is also open. *Evidence:* WP4 brief, citing gov.uk. **An accountant must confirm; see §5.** *AMENDED 2026-09-23 (see F6):* the £90k threshold is moot, because the founder's business is already VAT-registered.

**F6. The founder's business is already VAT-registered** (the user, 2026-09-23). If the platform runs inside that business as principal, **20% output VAT applies to the gross price of every coaching sale from day one**, not above a threshold. The agent-versus-principal structure (and possibly a separate legal entity for the platform) is therefore urgent, not a scaling concern. The founder's own coaching is his supply either way; the question is the other coaches' sales.

**F7. WP3 returned: web-first is reasonable, gated on an iOS Safari audio test.** [03-client-stack.md](./research/03-client-stack.md). **The strongest case for native:** a student sings along to a guide track in headphones. Only native iOS gives control of voice processing, audio routing and mic choice, plus background upload. Safari's echo-cancellation constraint was historically ignored, and a low-pass filter was reported even after the fix. iPhone is about 51% of UK mobile traffic. Mitigation: a 1–2 day measurement on real iPhones before building; chunked, resumable uploads; the `<input capture>` native-camera fallback; and seven measurable triggers for moving to a Capacitor shell. **In-app purchase:** the lead verified Apple guideline 3.1.3(d) verbatim on 2026-09-23. It covers "real-time person-to-person services" only, so async coaching is not exempt. **This agrees with WP4's assumption** (F3, decision 8). WP3 also found evidence that a login-only companion can be rejected (single forum report, confidence about 55%); decision 8 is amended accordingly.

**F8. WP2 returned: there is no educational carve-out for a paid platform.** [02-legal.md](./research/02-legal.md). CDPA s.32 (illustration for instruction) and s.29 (private study) require a non-commercial purpose; the UK private-copying exception was quashed in 2015. **The mitigating point:** a strictly one-to-one private upload is probably not "communication to the public" (Reha Training C-117/15), which leaves exposure mainly in reproduction. That is low enforcement risk, but not lawful per se. **Backing tracks:** singing over the original master is the worst case, since PPL doesn't license on-demand use. Purchased karaoke tracks are licensed for the "private circle" and cover the recording, not the song. Coach-made backing tracks leave only the composition, which a PRS online licence could cover (from about £193 + VAT a year, **not yet re-verified by the lead**). **The single most important mitigation: submissions stay strictly one-to-one, with no sharing, public links or showcase feed.** WP2 also flags the Online Safety Act as probably applicable. *PRS figure VERIFIED 2026-09-23:* PPL PRS "Digital Music Licence for Fitness and Dance", "Fees start from £193 + VAT for a 12-month rolling licence", for operators under £150k of applicable revenue. **It is an analogue, not a licence that covers singing tuition.** Which tariff applies to us is a question for PRS. Reha Training is not independently re-verified (the lead's own knowledge agrees with the reading); the proposal must present the "not communication to the public" reading as a solicitor question, not settled law.

**F9. WP1 returned: Bunny Stream is cheapest at our profile; retention dominates cost.** [01-video-hosting.md](./research/01-video-hosting.md). At 1,000 students and 720p, Bunny costs **$6,330.84/year with 12-month retention and $2,533.92/year with 90-day retention.** *Lead's independent recomputation (2026-09-23):* stored hours are 25k submissions plus 12.5k feedback = 37.5k h × 1.125 GB/h = 42,188 GB × $0.01 = $422/month. Delivered hours per month are 4,167 (submissions ×2) + 4,167 (library) + 1,042 (feedback) = 9,375 h = 10,547 GB × $0.01 = $105/month. **That gives $527.57/month; the figure matches.** Bunny's pricing page, re-fetched, confirms $0.01/GB storage, delivery "from $0.005/GB", free encoding and a $1 monthly minimum. The brief used $0.01/GB delivery, the standard EU/NA rate, which is conservative. **Caveats the brief flags:** costs assume one video version per upload (a full quality ladder plus kept originals adds 2 to 3 times to storage); no host publishes its audio bitrate; Cloudflare Stream and Mux bill per stored minute; Vimeo's bandwidth threshold is 2 TB/month. **Housekeeping:** WP1's browser tool left a stray `.playwright-mcp/` folder in the repo root. It is not part of the arc.

**F10. Facade stage 1: the core stack assumptions hold on Windows.** Commits `694078b` to `c1b6276` on `facade`.
- **Runs as designed:** React Router 8.4.0 SSR runs on the Workers runtime (workerd) through `@cloudflare/vite-plugin` 1.58.0, with Mantine 9.6.2 SSR, the pnpm 9 workspace, and a repositories-on-context seam.
- **Lead re-verification 2026-09-23:** `pnpm typecheck`, `pnpm lint` and `pnpm test` (4 of 4) pass on the committed tree, which is clean.
- **Lint gate convicted by mutation:** a probe component with a missing-deps `useEffect` and a setState-in-effect failed `pnpm lint` with **two errors** (`react-hooks/exhaustive-deps` and `react-hooks/set-state-in-effect`). The probe was deleted, never committed. The second rule directly targets the recursive-update class the CTO reported (D24).
- **Stack versions:** React 19.3.0, Vite 8.3.0 (above the spec's 7+ floor), TypeScript 6.0.3, Zod 4.6.5, wrangler 4.137.0.
- **Pitfalls 1 to 4** are in [facade-pitfalls.md](./facade-pitfalls.md): the TypeScript 7 / typescript-eslint gap (D30); orphaned `workerd.exe` on Windows; the `*.m4a` ignore rule versus committed media (stage 2 adds a scoped exception); Mantine `Title` not being polymorphic.

**F11. Facade stage 2: media pipeline prototype and player built; one real pitfall (Range).** Commits `9c52f0a` to `44b7678`.
- **Built:** synthetic fixture media (3.73 MB, including an HLS rendition); a unit-tested ffmpeg peaks job (the D21 prototype); wavesurfer.js 8.0.0 on pre-computed peaks; hls.js 1.7.3 with native-HLS detection; and a `useReducer` `PlayerProvider` with an imperative handle.
- **Lead re-verification:** `pnpm test` passes (8 + 15 + 8 tests); the tree is clean.
- **Pitfall 6 (Range)** is ruled in D31.
- **Pitfall 7:** Playwright WebKit on Windows has neither native HLS nor MSE, so it falls back to MP4. **Real iOS Safari HLS remains untested** until a device check.
- **Pitfall 5:** pnpm and path case on Windows.

**F12. D31's facade fix landed and was convicted by mutation.** Commits `ed79e6f` to `2f8ec9d`. The Worker entry serves `/media/*` ahead of React Router through `assets.run_worker_first`, with a unit-tested pure range parser.
- **Lead's own check against `pnpm preview`:** `Range: bytes=0-99` on `student-take-a.m4a` returned `206`, `content-range: bytes 0-99/611219`, `content-length: 100`.
- **Delegate's mutation run:** with the route disabled, the tightened Chromium seek test failed 6 of 6 (the seek landed at 0). With it enabled, the test passed 12 of 12 across both browsers. The test throttles `.m4a` to 64 KB/s so media is genuinely unbuffered at click time. Without throttling, Chromium sometimes buffered the whole file and masked the bug.
- **Operational:** stop preview servers by matching the command line to this repo (`Win32_Process` where CommandLine contains `singology-app`) plus the repo's `workerd.exe`. Other `node.exe` processes on this machine are unrelated and must not be killed.

**F13. Facade stage 3a: landing, role switcher, shell and every student surface are built.** Commits `4c6a7d3` to `4a6c228`.
- **Lead re-verification:** `pnpm test` passes 73 tests (8 + 31 + 34); typecheck is clean; the tree is clean.
- **Delegate evidence:** e2e passed 33, with 1 skipped by design; `--repeat-each=3` passed 99 of 99.
- **New pitfalls:**
  - 8: Playwright WebKit on Windows can't play `blob:` media, so the upload-panel flow is proven only in Chromium. **It needs a real-Safari check.**
  - 9: a Mantine `Badge` inside `Text` breaks hydration (fixed).
  - 10: WebKit logs a console error for a cancelled `/__manifest` fetch on navigation (the test accommodates it).
  - 11: the preview server crashed once under stress, cause unknown. **The lead watches for it in stage 4.**
- **Accepted interpretations:** `CoachOffer.billing` with `pricePence` (to fit single-review pricing); a mismatched role redirects to `/demo`; the upload action posts metadata only, never the file.
- **Ruled in D32:** fixed fixture dates.

**F14. Facade stage 3b: the coach surfaces are built and D32 is implemented. Pitfall 11 now reproduces.** Commits `52dd4c4` to `f8be525`.
- **Built:** the `/coach` queue (SLA from loader data, with a `useNow` clock on `useSyncExternalStore`) and the `/coach/reviews/:submissionId` workspace (add-comment-at-current-time, previous take, reply upload, assign checklist, and a Zod-validated send action).
- **Lead re-verification:** `pnpm test` passes 105 tests (shared 9, media 8, db 41, web 47); the tree is clean.
- **Delegate evidence:** plain `test:e2e` passed 47 of 47 (3 skipped); **`--repeat-each=2` failed on all 4 runs** with miniflare `fetch failed`, then 500s or connection refused, across unrelated specs.
- **Pitfall 12:** a floor-rounded client clock ran behind server time (fixed).
- **Accepted interpretations:** an added earlier take for one student so "previous take" has data; an optional feedback summary field; the upload panel's `fetcherKey` prop for reuse.
- **Pitfall 11 is under bisection by a diagnostic delegate** (2026-09-24). The question: is it our code (the media handler, leaks) or the local Vite-plugin/miniflare proxy? *Resolved in D33: the local proxy (classification B).*

**F16. Code review of the facade: the behaviour is sound, the shape is not yet slice-ready.** The three reviewers returned:
- **typescript-type-reviewer:** 2 BLOCKING, both trivial. No `any`, no suppressions, no floating promises; types consistently derive from the `packages/shared` Zod schemas.
- **react-quality-reviewer:** 4 BLOCKING, 6 NOTE. The main one: `WaveformPlayer.tsx` is 347 lines, with a 97-line initialisation effect. It confirmed the D24 and D32 compliance, including the throttled media time and textbook `useSyncExternalStore` clocks.
- **singology-style-decomposition-reviewer** (the D34 agent's first run): 19 BLOCKING, 8 NOTE. The pattern is **cross-stage duplication**, where separate delegates solved the same problem independently, plus loaders doing record assembly and ownership checks that belong behind `Repositories`.
**Lesson for future briefs: name the shared helpers (formatters, result types, test helpers) in every stage brief.** The arc-lead skill's "name shared primitives" rule was under-applied across stages 2 to 3b.

**F18. Review-fix waves 0 and 1 have landed on `facade-review-fixes`** (`1e4adcd` to `7fb1296`, 14 commits).
- **Wave 0:** Prettier, with the format-only commit `cfc4eb5`; ES2023.
- **Wave 1:** ownership getters `submissions.getForStudent` and `getForCoach` returning `OwnedSubmission | undefined`; `library.getMany` and `media.getMany`; `feedback.forSubmissionWithComments`; `submissions.queueViewForCoach` returning `CoachQueueItem[]`; `coaches.listWithOffers`; `ActionResult<T>` plus `parseInput(schema, input, fallback)`; the review action is JSON-only (the upload panel posts JSON too); `reviewSla` and `formatElapsed` take the coach's `turnaroundHours`; the turnaround shows in days, and the monthly review count is rendered from data (the two *visible* changes).
- **Lead re-verification:** `pnpm test` passes 120 tests (17 + 8 + 49 + 46); typecheck is clean; the tree is clean; a grep finds no `await` inside a loop and no `flatMap(x ? [x] : [])` in the routes. The delegate reports e2e passing 47 with 3 skipped after each wave.
- **Side effect:** Prettier reformatted `.claude/agents/*.md` (not in `.prettierignore`). This is layout only and accepted.
- **Fix-cycle review of `cfc4eb5..356d201`:** all seven Wave 1 findings (S-B2, S-B3, S-B7, S-B8, S-B9, S-B10, S-N8) are **CLOSED by shape change**. The fixes introduced 5 new BLOCKING issues and 5 NOTEs, **which the lead accepted in full as Wave 1b** in [facade-review-fixes.md](./facade-review-fixes.md). The most important: the six superseded repository methods stayed on the interface the slice must implement.

**F19. Review-fix waves 1b and 2 have landed** (`6fe3273` to `b235007`, 22 commits).
- **Lead re-verification:** `pnpm test` passes 131 tests (24 + 8 + 48 + 51); lint is clean; the tree is clean. The delegate reports build and e2e passing 47 with 3 skipped after each wave.
- **`WaveformPlayer.tsx` went from 356 to 126 lines** via `useWaveformInstance({ containerRef, mediaRef, asset, comments, loop, dispatch, height, theme })` plus `PlayerControls`. New primitives: `StandalonePlayer`, `useActionNotification(fetcher, successTitle)`, `readJson`, `MessageResult`, `indexById`. The six dead repository methods are deleted, and `zod` is now dev-only in `apps/web`.
- **Accepted interpretations:**
  - the waveform turns **teal (brand)** from default blue, a deliberate visible change per S-B15;
  - new spacing tokens `xxs` (4 px) and `xxl` (48 px); 6 px gaps become 4 px;
  - `mah={320}` stays on the video preview;
  - `student.home` keeps a `flatMap` over assignments, **because two assignments can share one library item, so mapping over items would change the rows**. The fix-list wording was wrong here, and the implementer correctly preserved behaviour.
- **Fix-cycle reviews on `354b449..31968d2`:**
  - **Style:** 13 of 14 items are CLOSED by shape change; S-N5 is closed at the listed sites, with one hand-built wrap left. 7 new BLOCKING, all small follow-ons (a test-local copy of `indexById`, JSDoc stranded by the props renames, derived "72" literals). All four implementer interpretations were judged sound.
  - **React:** R-B1 to R-B4, R-N1, R-N4 and R-N5 are CLOSED. R-N2 is partial (`UploadPanel.tsx` is still 207 lines, because the markup was never split). R-N3 is partial (three props types still unexported). All four new hooks pass the finger rule and the hooks/components split.
  - **The lead accepted all of it as Wave 2b.** The 6 px to 4 px spacing change (three gaps and one margin absorbed by `xxs`) is accepted as imperceptible.

**F20. Review-fix waves 2b and 3 have landed** (`7ffbf52` to `926af47`, 43 commits).
- **Lead re-verification on the final tree:** `pnpm test` passes 140 tests (28 + 8 + 38 + 66); lint and `format:check` are clean; `pnpm test:e2e` passes 47 with 3 skipped by design, in Chromium and WebKit, under `wrangler dev`; the tree is clean.
- **Outcomes:**
  - `UploadPanel.tsx` is 116 lines (`PickedFilePanel`, `RecorderTips`);
  - typed `href()` from React Router 8.4.0 is used for links, with the nav table in `navItems.ts` and `HOME_FOR_ROLE` derived from it;
  - **PostCSS removed**: the built CSS is byte-identical without it, and Mantine's docs say the preset is only for app CSS;
  - the shared primitives from the fix list are all in place.
- **Accepted interpretations:** **`isbot` stays** (pitfall 14: React Router's default server entry imports it, and the tooling re-adds it); `@singology/db` exports `createFixtureData`, so the app-side public-folder test avoids a deep import; `formatSince` takes the display threshold as an argument; the theme types `brand` via Mantine's colour override.
- **New minor warning:** Vite warns that `vite.config.ts` imports `./previewPort` without a file extension, which the future native config loader rejects. To be folded into the final findings.
- **Final three-reviewer pass (style, React, type) is running.**

**F17. The facade is deployed (2026-09-24), by the user, at `https://singology-facade.resort-reference-gallery.workers.dev`** (Worker `singology-facade`, version `d176313f-cfc4-448e-a052-070224027569`). Built from `facade` at the reviewed code; the commits since are notes only.
- **Account facts** (read-only API inspection by the lead, token never printed):
  - the `workers.dev` subdomain is `resort-reference-gallery`, shared with the user's other Worker `resort-reference`;
  - the Zero Trust team domain is `aged-firefly-81d4.cloudflareaccess.com`;
  - wrangler's OAuth token has no Access scope, so **Access must be configured in the dashboard**.
- **Gating check right after deploy:** the facade returned `200` (public), so the existing Access policy is per-Worker, not account-wide. `resort-reference` still returned `302` to its Access login (unaffected). **The user is gating the facade with an email allow-list (the user plus the founder).** The subdomain separation is to be cleaned up later, by user decision. *UPDATE 2026-09-24:* the user enabled Access. The lead re-checked from outside: `/` and `/media/student-take-a.m4a` both return `302` to `aged-firefly-81d4.cloudflareaccess.com`. **The facade is gated.**
- **Bundle finding (updates pitfall 13):** the chunk over 500 kB is `hls.js` (575 kB minified, 179 kB gzip). It is already dynamically imported only when an HLS source plays, so it doesn't weigh on the audio-first student pages.
- **Operational:** the agent auto-mode classifier refuses `wrangler deploy` from the lead, so **deploys are run by the user** (`! pnpm --filter @singology/web exec wrangler deploy` after `pnpm --filter @singology/web run build`). The "No projects matched the filters" warning is pitfall 5 (path case); the deploy still resolves the right build.

**F15. Final facade verification by the lead (2026-09-24).** After a forced reinstall from the lockfile, the lead ran `pnpm test` (105 pass) and `pnpm test:e2e` (47 pass, 3 skipped by design) on the final tree. The lead reviewed screenshots of the landing page (375 px), the student feedback view (375 px) and the coach review workspace (1280 px): they are coherent, readable and on-message. The one new pitfall is chunks over 500 kB (pitfall 13), a slice concern.

**F5. WP4 and WP5 differ slightly on CoachNow.** WP4 says there's no multi-coach payout from one sale. WP5 found that CoachNow Academy has Stripe Connect and multi-coach roles, but per-coach pricing is unverified. The lead's re-fetch confirms Academy includes "Invoicing and Billing through Stripe Connect" and "Flexible Multi-Coach Pricing Available". **The difference doesn't affect the plan:** the pilot takes payment through Stripe Payment Links outside the tool, and the build owns its DB either way.
