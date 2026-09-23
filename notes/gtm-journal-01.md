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
- **Git (from 2026-09-23):** a local repo on `main`, with no remote yet. `.gitattributes` forces LF (`* text=auto eol=lf`), overriding the machine's global CRLF conversion; keep it that way for the Workers/Linux toolchain. `.gitignore` excludes source audio (`*.ogg` and similar: the founder's voice is personal data, so only the transcript is tracked), `.playwright-mcp/` agent artefacts, secrets (`.env*`, `.dev.vars`), and future build output (`node_modules/`, `.wrangler/`, `.react-router/`).

## 4. Next work

- **The draft proposal is complete:** [gtm-proposal.md](./gtm-proposal.md), written 2026-09-23 from all five briefs (F1 to F9). It awaits the user's review.
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

**F5. WP4 and WP5 differ slightly on CoachNow.** WP4 says there's no multi-coach payout from one sale. WP5 found that CoachNow Academy has Stripe Connect and multi-coach roles, but per-coach pricing is unverified. The lead's re-fetch confirms Academy includes "Invoicing and Billing through Stripe Connect" and "Flexible Multi-Coach Pricing Available". **The difference doesn't affect the plan:** the pilot takes payment through Stripe Payment Links outside the tool, and the build owns its DB either way.
