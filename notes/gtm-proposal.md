---
title: "Singology Coaching Platform: GTM Proposal"
type: proposal
status: draft
---

# Singology Coaching Platform: GTM Proposal

An asynchronous singing-coaching platform built and owned by Singology. Students work through a library of exercise videos, record themselves, and get feedback from a coach they choose and pay for. The founder's coaching sits at a premium tier; other coaches are priced below. This proposal answers the CTO's four questions in [gtm-vision.md](./gtm-vision.md) and sets out the launch path.

Evidence is in five research briefs: [01 video hosting](./research/01-video-hosting.md), [02 legal](./research/02-legal.md), [03 client stack](./research/03-client-stack.md), [04 backend, auth and billing](./research/04-backend-auth-billing.md), [05 product and landscape](./research/05-product-landscape.md). Rulings and their reasons are numbered in [gtm-journal-01.md](./gtm-journal-01.md) and cited here as "D1" (decision 1) and "F1" (finding 1). Key prices and citations were re-checked against primary sources on 2026-09-23.

> Nothing here is legal or tax advice. The legal and VAT positions are research to brief a solicitor and an accountant; the questions they must answer are listed in [§8](#8-questions-for-professionals).

## 1. Summary

- **Build and own** (D9). The founder's standing and established choirs are the moat. Agentic development removes the build cost that used to make buying rational. The choir pilot runs on our own MVP.
- **Video: Bunny Stream** for all media, with Cloudflare R2 plus our own pipeline as the fallback (D11). **YouTube is ruled out:** its API policy forbids charging users to watch embedded videos (D10). Vimeo stops fitting at about 1,000 students.
- **Infrastructure cost is not the constraint.** At 1,000 students, video costs roughly **\$225/month (about $0.23 per student)** under our retention policy, against roughly £35k/month of subscription revenue. The real constraints are coach time per review and VAT structure.
- **Copyright: there is no educational carve-out for a paid platform.** Strictly one-to-one private submissions are probably not "communication to the public", which keeps the risk low, but not nil. Product rules keep it that way: no sharing, no public links, no original master recordings as backing tracks.
- **Client: web-first is right, but not blind.** The native-iOS case is real and specific: singing along to a guide track in headphones. Web-first holds because students record in the phone's own recorder app and upload the file, which avoids the browser's audio stack entirely (D16, D28). A pre-agreed trigger list governs any move to a Capacitor shell.
- **Backend: own a Supabase (Postgres) database in London; bill through Stripe Connect.** There is one subscription per student–coach pair, and card data never touches us (D8).
- **Biggest open risk: VAT.** The founder's business is already VAT-registered, so if the platform sells coaching as principal, 20% VAT applies to every sale from day one (F6). The platform must be structured as the coaches' agent, and possibly as a separate entity. **This needs an accountant before launch.**
- **Launch:** adults only (D13), audio-first submissions (D14), invite-only to choir members, 12–15 students and 2 coaches for 12 weeks.

## 2. Product and market

**The loop** (from the founder's brief): a warm-up and exercise library, then a weekly assignment, the student records, the coach gives timestamped feedback and a reply, then the next assignment.

**Closest competitors** (details in [05](./research/05-product-landscape.md)):

| Product | Model | Relevance |
|---|---|---|
| Pronto Me | Async per-submission feedback from named coaches, each at their own price. Vocal coaches charge **$17–30 per submission** (F2) | Closest model; US and audition-focused, no library, no ongoing programme |
| ArtistWorks Video Exchange | Course plus video submission to the instructor | Closest shape, but exchanges are visible to other members |
| CoachNow, Trainerize | Async video coaching for sport and fitness (the PT model the founder cited) | Proves the loop; not built for singing audio |

**Where Singology differs:** an existing community and a trusted founder, a weekly relationship rather than one-off reviews, a curated warm-up library, and coaches at tiered prices. No competitor combines all four.

**Singing-specific features, in priority order:** audio-first capture; timestamped comments on a waveform; looped playback of a passage, slowed without changing pitch; A/B comparison with earlier weeks on the same exercise; a progress timeline; warm-ups filtered by voice type.

**Pricing, as a starting range to test in the pilot** (WP5; the founder decides):

| Tier | Monthly (4 reviews) | Single review |
|---|---|---|
| Founder | £65–95 | £20–30 |
| Standard coach | £35–55 | £10–15 |
| Platform commission | 15–25% of coach revenue | |

This pricing assumes a review takes a coach 10–15 minutes. That figure is unverified, and the pilot must measure it.

## 3. Q1: Video hosting

### Verdicts

| Option | Verdict | Why                                                                                                                                                                                                                                                                                                                       |
|---|---|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **YouTube** | **No** | API Developer Policies III.F.3.a: "API Clients must not charge users to watch content in an embedded YouTube player" (verified). Unlisted links can't be access-controlled or revoked. YouTube's branding and ads can't be removed. Uploads of pop covers go through Content ID. Upload quota is 100 per day per project. |
| **Vimeo** | Pilot only | Every self-serve plan has a 2 TB/month bandwidth threshold. At 1,000 students, delivery is 5–21 TB/month, which forces unpriced Enterprise. Ownership changed in November 2025 (Bending Spoons).                                                                                                                          |
| **Cloudflare Stream, Mux, api.video** | Good products, wrong pricing shape | They bill per stored minute. Student uploads pile up, so these cost 10–20 times more than per-GB hosts. They are viable for the 20-hour library alone (a hybrid option).                                                                                                                                                  |
| **Bunny Stream** | **Primary** | \$0.01/GB storage, free encoding, delivery from \$0.005/GB (verified). Token-authenticated playback, our own player, resumable (tus) uploads, webhooks, and the original file can be kept.                                                                                                                                |
| **Cloudflare R2 DIY** | **Fallback** | Egress is free. We build and own transcoding and access control. It wins if we keep several quality versions and the originals.                                                                                                                                                                                           |
| **Supabase Storage** | No, for media | Its egress costs 9 times Bunny's. Keep Supabase for data.                                                                                                                                                                                                                                                                 |
| **Vercel** | No | Its bandwidth pricing doesn't suit media. The frontend is on Cloudflare Workers (D17).                                                                                                                                                                                                                                    |

On the CTO's three concerns:
- **(a) Access flexibility:** Bunny and R2 both act as a private video database behind our auth. Our backend mints short-lived playback tokens.
- **(b) Bootstrapping:** Bunny is the least to build; R2 is the most.
- **(c) Cost:** below.

### Cost

The model follows D3: 25 h of uploads per student per year, each watched twice (coach and student); 1 h/week of library viewing; 0.25 h/week of coach feedback video. Coach viewing is included.

**Bunny Stream, annual totals** (WP1; arithmetic independently re-checked by the lead, F9):

| Students | Audio-only | 480p | 720p | 1080p |
|---|---|---|---|---|
| 100, 12-month retention | $33 | $305 | $636 | $1,271 |
| 100, 90-day retention | $13 | $123 | $256 | $512 |
| 1,000, 12-month retention | $324 | $3,039 | $6,331 | $12,662 |
| 1,000, 90-day retention | $130 | $1,216 | $2,534 | $5,068 |
| 10,000, 12-month retention | $3,240 | $30,376 | $63,284 | $126,568 |
| 10,000, 90-day retention | $1,296 | $12,151 | $25,315 | $50,630 |

**Other hosts, 1,000 students at 720p, annual:**

| Host | 12-month retention | 90-day retention |
|---|---|---|
| Bunny Stream | $6,331 | $2,534 |
| R2 DIY | $7,658 | $1,962 |
| Supabase Storage | $18,719 | $10,632 |
| Mux | $69,275 | $20,675 |
| Cloudflare Stream | $141,870 | $40,590 |

**Our policy lands near the cheap end.** Full-quality video is kept for 90 days; after that, only the audio track is kept for the life of the account (D12). Submissions default to audio-only, with video required per assignment (D14). **At 1,000 students, worst case (every submission at 720p): about \$211/month for video plus about \$14/month for the audio archive, roughly \$2,700/year.** Mostly-audio submissions bring this well below that. At 10,000 students the same worst case is about \$27,000/year.

Adding several quality versions per video, kept originals, or a second storage region could multiply storage costs by 2–3 times. That is still an order of magnitude below the per-minute hosts.

### Audio fidelity (D4)

No host publishes the audio bitrate it re-encodes to. **Gate:** upload a sung reference recording through Bunny and through R2, then compare the output with the original by spectrum and by ear. Minimum bar: AAC-LC at 160 kbps stereo or 128 kbps mono, 48 kHz, with the original upload kept.

## 4. Q2: Copyright and legal

**Is there a safe educational carve-out? No.** UK CDPA s.32 (illustration for instruction) and s.29 (private study) both require a *non-commercial* purpose, which a paid platform fails. Criticism, review and quotation don't stretch to whole songs. The UK has had no private-copying exception since 2015. US fair use is arguable for the student but weak for the platform.

**What does help:** a submission visible only to the student and one assigned coach is **probably not "communication to the public"**. CJEU case law, still followed in the UK, requires an indeterminate and fairly large audience. That leaves exposure mainly on the copies themselves (the recording, our stored copy and transcodes). This is **low-risk, not lawful**, and is a solicitor question, not settled law.

**Re-recordings and backing tracks:**

| Student sings over... | Extra rights engaged | Position |
|---|---|---|
| The original hit | Sound recording (label) plus performers' rights | **Worst case.** PPL doesn't license on-demand use. **Disallow.** |
| A bought karaoke track | Backing-track maker's recording | Usually licensed for the "private circle" only; the song itself is not covered. Grey area; a solicitor question. |
| A backing track the coach made | None beyond the song | **Cleanest.** Only the composition is engaged. |
| Unaccompanied or live piano | None beyond the song | Clean apart from the composition |

**Does the platform choice change it?** Not the underlying copyright question: the student's reproduction exists wherever it's hosted. But platform choice changes almost everything around it. YouTube adds its own terms breach and Content ID (blocks, muting, others' ads on student videos, strikes on our channel). Self-hosting on Bunny or R2 makes us the host. Our shield is then the UK hosting defence (e-Commerce Regulations 2002, Reg. 19) and, for US users, DMCA §512. Both require a working notice-and-takedown process and a repeat-infringer policy.

**The coach library is different:** it *is* communication to the public. Build it from original exercises and public-domain repertoire. If copyrighted songs are wanted, get a PRS for Music licence. The nearest published analogue is PPL PRS's Digital Music Licence for Fitness and Dance: "from £193 + VAT" a year for operators under £150k of revenue (verified). PRS must confirm in writing which licence covers us.

**Product rules that follow:**
1. Submissions are strictly one-to-one: no sharing, no public links, no showcase feed, no downloads by anyone but the owner. **This is the single most important mitigation.**
2. No original master recordings as backing; coaches supply backing tracks.
3. The library is original or public-domain, or PRS-licensed.
4. Terms of service: students warrant their submissions and accept a repertoire policy. Coaches sign an agreement granting the platform a licence to their library videos that survives their departure, with a clearance warranty.
5. A takedown procedure, a DMCA agent registration, and a strike policy.

**Beyond copyright** (WP2 risk register):
- **Adults only at launch** (D13) removes the only severe risk: a safeguarding incident involving a minor. Adding minors later needs the Children's Code, a DPIA, guardian-linked accounts, and enhanced DBS checks with the barred list for coaches.
- **The Online Safety Act probably applies** to a user-to-user service. That means a written risk assessment and reporting tools, about 1–3 days of work.
- **UK GDPR:** voice and face recordings are personal data. Host in the UK or EU (Supabase London; Bunny EU storage region). D12's retention policy is our storage-limitation position.
- **Coaches are contractors on a marketplace.** Their employment status needs professional review.

## 5. Q3: Client stack

### The counter-argument, in its strongest form

The core moment of the product is a student singing along to a guide track in headphones while their voice is captured cleanly. Then a large file must upload without anyone babysitting it. On an iPhone, native code controls every part of that:
- **Voice processing:** `AVAudioSession` in `.measurement` mode turns off echo cancellation, automatic gain control and noise suppression.
- **Audio routing:** playback stays in the headphones while the phone records from a chosen mic, including USB interfaces.
- **Background upload:** a background `URLSession` upload finishes after the phone locks.

A web page can only *request* these things. WebKit's history includes an `echoCancellation` setting that once did nothing, and residual filtering was reported after the fix. There are also reports of mic capture pushing playback from headphones to the speaker. iOS Safari has no Background Fetch, so uploads die with the tab.

**iPhones are about 51% of UK mobile traffic and about 70% of app-store consumer spend.** The requirement we have made first-class (audio fidelity) is weakest on the platform most paying students will use. Your Apple aversion would make this easy to underweight. It is the strongest argument in the whole proposal against your preference.

What the native case does **not** win:
- **Recording format:** since Safari 18.4, MediaRecorder records PCM and ALAC, so that gap has closed.
- **Payments:** a native app makes things *worse*. Apple's person-to-person exemption (3.1.3(d)) covers "real-time" services only (verified), so async coaching probably isn't exempt. A login-only companion app has reportedly been rejected (F7). Web checkout avoids Apple's and Google's payment rules entirely.
- **Iteration speed:** preview-per-branch deploys versus app review. Your instinct is right here.

### Verdict

**Capture is upload-first** (D16). Every assignment accepts a file recorded in the device's own recorder: Voice Memos set to Lossless, or the Camera app, on iPhone; the best built-in or recommended app on Android; a DAW or USB interface for advanced students. The native recorder bypasses the browser's voice-processing path, so this is the audio-quality escape hatch, and it ships first. In-page recording is added on top, only where the phase-0 test shows it is as clean.

**Web-first, with three conditions:**
1. **Capture uses the phone's own recorder, then an upload** (D16). Its audio quality is trusted without a pre-build test (D28). The remaining risks are workflow ones: a backing track on the same phone, recorder settings, mic distance, and large files. The recommended-recorder guide and the beta circle handle them. In-page recording is a later convenience, and WP3's fidelity test applies to it if built.
2. **Uploads are chunked and resumable** (tus, supported by Bunny), and the UI tells the student to keep the screen open.
3. **Pre-agreed triggers for a Capacitor shell.** It reuses the web UI and adds a native recorder and background upload. Move when any one is measured:
   - an in-page recording fidelity test fails (applies only if in-page recording is built);
   - coaches flag more than 10% of iPhone submissions as having unusable audio;
   - iPhone upload failure exceeds 5%;
   - iPhone 8-week retention trails other platforms by 10 points or more;
   - Web Push reaches under 30% of iPhone users;
   - 10 or more requests a quarter for external-mic support;
   - Apple restricts home-screen web apps in the UK.

**You need an iPhone even for web-first.** Playwright's WebKit engine is desktop WebKit, not iOS Safari, so a used iPhone (about £156) is a necessary test device, not a luxury. A Mac is not needed: if a native shell is ever built, it compiles in cloud CI (GitHub Actions macOS at about \$1 per build, or Codemagic's free tier), plus the \$99/year Apple developer fee.

**Kotlin Multiplatform is not pursued.** Compose for iOS has been stable since May 2025, but it shares nothing with a web frontend and still needs macOS CI. It would only make sense for an Android-first product, which this is not.

### CI/CD

- **Stack:** TypeScript throughout. React Router v8 (framework mode, via `@cloudflare/vite-plugin`) on Cloudflare Workers, Supabase, Bunny Stream and Stripe Connect (D17, D18).
- **Bootstrapping cost:** a mock-up runs on free tiers for about £0. Pilot-ready costs about $30/month plus a domain (Workers Paid plus Supabase Pro), plus Bunny usage.
- **Repo:** a pnpm workspace monorepo (D25): `apps/web` (the Worker), `packages/db` (Drizzle schema, RLS policies, repositories), `packages/shared` (Zod schemas and types), `supabase/` (config, migrations, pgTAP tests) and `jobs/media/` (the ffmpeg Container). No Turborepo; no Supabase Edge Functions (D23).
- **App libraries:** Mantine 9 (D19); wavesurfer.js 8 on pre-computed peaks, hls.js, tus-js-client, and native `preservesPitch` slow-down with no DSP library in the MVP (D20); no global client store, just loaders plus a scoped `useReducer` for the player (D24).
- **Previews:** every PR gets a preview frontend on Cloudflare Workers and a preview database (Supabase Branching). Previews and staging sit behind Cloudflare Access with an email one-time PIN allow-list, so the founder and coaches can review builds without platform seats (D17).
- **Checks on every PR:** typecheck, lint, unit tests, and Playwright on Chromium, Firefox and WebKit. Recording tests use Chromium's fake media device.
- **Before every release:** a manual check on the physical iPhone.
- **Agent workflow:** agents work on branches, and the preview URL plus preview database is what gets reviewed. Branch protection makes CI a gate agents can't bypass. Migrations and payment code always need the CTO's review.

## 6. Q4: Registration, auth and billing

**Own the core database: confirmed.** No off-the-shelf platform does all three of multi-coach payouts, per-coach pricing, and control of the audio pipeline.

**Backend: Supabase Pro in London** (`eu-west-2`). It's Postgres with row-level security, plus Auth. **Only the Worker talks to Postgres,** via Hyperdrive (query caching disabled) and Drizzle ORM. Every user query runs under the user's role and claims, so row-level security stays the authority. The Data API is disabled, and supabase-js handles Auth sessions only (D22). It costs **$25/month from 100 to 10,000 students** (100k monthly active users included; verified, F3), because video bytes live on Bunny, not in Supabase. The exit path is `pg_dump`.

**Data model** (WP4 §3):
- **Accounts:** profiles and roles (student, coach, admin, and guardian later), plus coach offers (the price tier).
- **Core:** enrolments (one per student–coach pair; the anchor for row-level security). Each enrolment has assignments, submissions (by Bunny asset ID) and messages. Each submission can have feedback, and each feedback can have timestamped comments.
- **Library:** library items.
- **Compliance and payments:** consent records, an append-only audit log, and a Stripe events table for webhook idempotency.

Key rule: *a coach can read a submission only if they are the coach on an active enrolment.*

**Auth:** magic link or one-time code, plus Google and Apple sign-in. Multi-factor authentication is required for coaches and admins. Coaches join by invitation only. Worker routes mint Bunny upload signatures and playback tokens after the access check, and host the Stripe and Bunny webhooks (D23).

**Media pipeline** (D21): video submissions go to Bunny Stream. Audio submissions go to Bunny Storage with the original kept untouched. A Cloudflare Container running ffmpeg makes a browser-playable listening copy (iPhone's lossless Voice Memos use ALAC, which only Safari plays) and computes the waveform peaks for both.

**Billing: Stripe Connect** with Express-style connected accounts. Stripe runs coach identity checks (KYC); we never see coach bank details. Sales use destination charges plus Stripe Billing subscriptions: **one monthly subscription per enrolment**, priced by the coach's tier, with a submission allowance and the library bundled. We use Stripe Checkout and the Customer Portal, which puts us in the lightest PCI scope (SAQ A). We store only Stripe IDs and status, updated by webhook.

Stripe fees (verified): about £0.97 on a £35 subscription, plus **£2 per coach per month in which they're paid, and 0.25% + 10p per payout.** Paddle and Lemon Squeezy are ruled out because they prohibit marketplaces.

**VAT, the critical item** (F4, F6): the founder's business is VAT-registered.
- **If the platform sells as principal**, VAT is due on the full price of *every* coach's sale: about £5.83 of a £35 plan, which consumes a 20% commission.
- **As disclosed agent for the coaches**, only the commission is the platform's supply.

Structure the terms for agency, and ask the accountant:
- whether the platform should be a separate entity from the founder's business;
- whether Stripe calling the platform "merchant of record" on destination charges undermines the agency position;
- whether singing tuition qualifies for the private-tuition exemption.

## 7. Launch plan

Durations are indicative.

**Principle: the pilot runs on production** (D15). The big decisions are made up front, in phase 0. The pilot cohort's accounts, subscriptions and history carry forward unchanged; nobody is ever asked to switch platforms. After launch, the only variables are how far and how fast features and scale grow.

| Phase | What | Exit condition |
|---|---|---|
| **0. Gates** (weeks 0–2) | A used iPhone as a Safari QA device (not a test gate; D28). A video-path audio check on Bunny Stream; audio submissions keep their originals (D21). The accountant on VAT structure and entity. The solicitor pack (§8). An enquiry to PRS. Founder answers on prices, choir size and adults only. | Capture path and host confirmed; VAT structure agreed |
| **1. MVP** (weeks 2–8) | Invite-only onboarding; coach cards; Stripe Connect subscriptions; the weekly loop; audio-first recording with resumable upload; a coach review queue with waveform, timestamped comments and a reply recording; about 10 original warm-up videos; email notifications; takedown process and terms. | The founder and one coach can run the full loop end to end |
| **2. Pilot** (12 weeks) | 12–15 choir members, founder plus one standard coach, paid from week 1 at a founding-member price. Coaches log minutes per review. | See the thresholds below |
| **3. Grow** | Open to the wider choirs; more coaches; Web Push; A/B comparison and progress timeline; Capacitor shell if a trigger fires; under-18s behind their own safeguarding gate. | |

**Pilot thresholds for scaling beyond the choir** (WP5; all must hold):
- sign-ups at least twice the number of places;
- at least 70% of students submitting each week;
- median coach turnaround of 72 hours or less;
- 15 minutes or less of coach time per review;
- at least 80% still paying at 4 weeks and 60% at 12 weeks;
- at least 50% willing to pay the full price.

These gate scaling, not building (D9).

## 8. Questions for professionals

**Accountant (before launch):**
1. Can the platform act as disclosed agent for coaches' sales? Does Stripe's merchant-of-record status on destination charges conflict with that?
2. Should the platform be a separate entity from the founder's VAT-registered business?
3. Does private singing tuition qualify for the VAT exemption?
4. Coach employment status under the marketplace model.

**Solicitor (before opening beyond the choir):**
1. Is a one-to-one authenticated submission a "communication to the public" (CDPA s.20, s.182CA)?
2. Is Singology an authoriser of students' reproductions because it solicits song submissions? How far do terms-of-service warranties protect us?
3. Does the Reg. 19 hosting defence cover coach library content?
4. Is singing over a bought karaoke track within its "private circle" licence?
5. Online Safety Act: which duties apply at our size?
6. For minors (later): regulated-activity status of async feedback; lawful basis and contracting age; whether coaches are processors or controllers.

**PRS for Music (in writing):** which licence covers (a) the coach library and (b) student cover submissions, and at what fee?

## 9. Decisions needed

| From | Question |
|---|---|
| Founder | Price points; whether coaches set their own prices or tiers are fixed; commission rate, and whether it applies to his own coaching |
| Founder | Choir size (sets the pilot size); adults only at launch (D13) |