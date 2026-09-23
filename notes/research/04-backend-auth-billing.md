---
title: "WP4 Research: Backend, Auth and Billing"
type: research
status: draft
---

# WP4 Research: Backend, Auth and Billing

Answers CTO question 4 in [gtm-vision.md](../gtm-vision.md), within decisions 5 (UK primary), 6 (minors in scope) and 7 (app-store payments shared with WP3) of [gtm-journal-01.md](../gtm-journal-01.md). All web sources were accessed 2026-09-23; see [Sources](#sources). Claims not confirmed against a primary source are marked **unverified**.

## Summary

- **Own the core database: confirmed.** No off-the-shelf coaching or course platform found does all three of multi-coach marketplace payouts, per-coach pricing and control of the audio pipeline (decision 4). They remain useful as a founder-only pilot before the build.
- **Backend: Supabase** (Postgres + Auth + RLS + Edge Functions) in the London region (`eu-west-2`). It is the most stereotyped option for a relational, permission-heavy domain. It costs about **$25/month on Pro from 100 to 10,000 students** (100k MAU included). The exit path is plain Postgres. Passkeys are in beta only (May 2026).
- **Billing: Stripe Connect marketplace**, using Express-style connected accounts (Stripe-hosted KYC) and **destination charges**. Paddle and Lemon Squeezy are ruled out: both prohibit marketplaces and human services.
- **Mechanic: one monthly subscription per coach, with a submission allowance.** Each coach has a price tier (founder higher, Kimberly lower), and the library is bundled. At £35/month, Stripe takes about **£0.97** (card + Billing), plus a £2/month active-account fee and a payout fee per coach.
- **VAT is the largest money risk.** If the platform acts as **principal**, VAT is due on the whole price once turnover passes the £90k threshold. That would take ~£5.83 of every £35 and wipe out a 20% commission. If it acts as a **disclosed agent**, only the commission counts. The commercial terms must be drafted for agency, and an accountant must confirm this.
- **App stores:** we assumed a native iOS app **cannot** rely on 3.1.3(d), because it covers *real-time* services and this product is asynchronous. The native apps would be login-only companions with no purchase UI. Web checkout stays the only purchase path.
- **PCI:** Stripe Checkout, Payment Element and Customer Portal keep us on SAQ A. We store only Stripe IDs and status, which arrive by idempotent webhooks.

## 1. Do we need to own a core database?

**Verdict: yes.** The CTO's assumption stands.

| Off-the-shelf option | What it offers | What we would give up |
| --- | --- | --- |
| CoachNow ($9.99 to $89.99/month; "Academy" tier for multi-coach) [1] | Video analysis, annotation, voice-over, coach–athlete spaces. Built for exactly the PT-style loop. | The pricing page does not say whether CoachNow takes payments for coaches or splits revenue (**unverified**). Sport-oriented tools. No say over audio encoding (decision 4). Its brand, not ours. |
| Kajabi ($143 to $499/month annual; 2.7 to 2.9% + $0.30 on Kajabi Payments) [2] | Courses (the exercise library), memberships, "coaching" products, customer app. | Kajabi "does not take a revenue share", and the page shows **no multi-instructor payout**. Paying Kimberly would be a manual process outside the platform. There is no async submission-and-feedback workflow (**unverified**). |
| Trainerize / Circle / white-label PT apps | Community (Circle) or PT programming (Trainerize). | Not researched against primary sources (**unverified**). They are the same kind of product as the two above: one business selling to its clients, not a marketplace. |

Across the three, we would give up: (a) marketplace payouts to several coaches at different prices, which is the founder's core commercial idea; (b) control over upload encoding and audio quality; (c) the student–coach assignment data model, which drives safeguarding rules if minors are allowed (decision 6); and (d) portability of the relationship data.

**Where off-the-shelf still helps:** a *concierge pilot*. The founder runs 10 to 20 students on CoachNow PRO ($49.99/month) or a Kajabi coaching product to test demand and pricing before the custom build is funded. This option is for the lead to weigh. It does not replace owning the database.

## 2. Backend options

| Criterion | **Supabase** | Firebase | Neon + Clerk / Better Auth | PocketBase | Convex |
| --- | --- | --- | --- | --- | --- |
| Relational fit | Postgres; foreign keys, joins, constraints | Document store; joins are hand-built | Postgres | SQLite | Document-relational; typed TS queries |
| Row-level security | Native Postgres RLS, with JWT claims available in policies | Security Rules (not SQL) | Postgres RLS works, but you wire the JWT claims yourself | Per-collection API rules | Authorization written in function code |
| Auth: magic link / OAuth | Yes / yes | Yes / yes | Clerk: yes / yes. Better Auth: plugins | Built-in (details **unverified**) | Via Convex Auth or Clerk |
| Passkeys | **Beta**, opt-in, API may change (May 2026) [3] | **unverified** | Clerk: Pro plan and above [4]. Better Auth: plugin [5] | **unverified** | Via Clerk |
| Guardian accounts | None built in. Model as a table plus RLS (all options) | Same | Clerk "Organizations" could model families (**unverified** fit) | Same | Same |
| UK/EU residency | London `eu-west-2`, plus Ireland, Frankfurt and others [6] | London region **unverified** | Neon regions **unverified** on pricing page. Clerk: no data-residency statement [4] | Wherever you host it | "Selectable data region"; EU **unverified** [7] |
| Price, 100 students | Free tier possible; Pro **$25/mo** [8] | Auth free to 50k MAU; Firestore likely a few $ [9] | Neon free/Launch (~$0 to 20, **estimate**) + Clerk $25 (for passkeys) [4][10] | ~£5/mo VPS (**estimate**) | Free / $25 per dev [7] |
| Price, 1,000 students | **$25/mo** | Low tens of $ (**estimate**) | ~$20 to 45 (**estimate**) | Same VPS | $25 per dev |
| Price, 10,000 students | **$25 + compute** (Small $15 → ~**$40/mo**, **estimate**) | Low tens of $ (**estimate**) | ~$45 to 80 (**estimate**) | Larger VPS | $25 per dev + usage |
| Lock-in and exit | Low: `pg_dump` to any Postgres. Auth users live in the `auth` schema | High: proprietary data model and rules | Low (Postgres). Clerk holds the user store; Better Auth does not | Medium: SQLite file, but custom APIs | Medium to high: proprietary query model |
| Agentic suitability | Very high: widely documented, SQL migrations, CLI, official agent skills and MCP | High, but security rules are error-prone | High, but more parts to wire together | Low: pre-1.0, "NOT recommended for production critical applications yet" [11] | Good TS DX, less common |

Video bandwidth never passes through the backend: media sits on the video host. So Supabase egress (250 GB included) covers only API and JSON traffic, and the 10,000-student figure is dominated by compute, not egress.

**Recommendation: Supabase Pro, London region.** The domain is relational and permission-driven: this student, this coach, this enrolment, this guardian. Postgres RLS expresses that permission logic next to the data and is the best-trodden path for an agentic build. The alternatives compare as follows:
- Neon + Better Auth is the fallback if Supabase Auth proves limiting. It is the same database with a different auth layer.
- Firebase is rejected because the domain is not document-shaped.
- PocketBase is rejected because it is pre-1.0.
- Convex is rejected because it is less stereotyped and has a harder exit.

## 3. Data model sketch

```
auth.users 1─1 profiles ─┬─< user_roles (student | coach | admin | guardian)
                         ├─1 coaches ─< coach_offers (price tier: £/month, submissions/period, stripe_price_id)
                         ├─< guardianships >─ profiles (student)       [guardian_id, student_id, consent_record_id]
                         └─1 billing_customers (stripe_customer_id only)

enrolments  (student_id, coach_id, offer_id, status, stripe_subscription_id,
             current_period_end, submissions_used)          ← the RLS anchor
  ├─< assignments ─< assignment_items >─ library_items (video_asset_id)
  ├─< submissions (assignment_id?, video_host, video_asset_id, status)
  │     └─< feedback (coach_id, body, reply_video_asset_id)
  │            └─< feedback_comments (t_seconds, body)      ← timestamped comments
  └─< messages (sender_id, body)

consent_records (subject_user_id, given_by_user_id, kind, version, given_at, withdrawn_at)
audit_log       (actor_id, action, entity, entity_id, at, meta)   append-only
stripe_events   (event_id PK, type, received_at, processed_at)    webhook idempotency
```

**Key RLS rules (prose):**
- A student can read and write only enrolments, submissions and messages where `student_id = auth.uid()`.
- A coach can read a submission only if they are the `coach_id` on its enrolment **and** that enrolment is active. A coach can write feedback only on those submissions.
- A student can insert a submission only if their enrolment is active and `submissions_used` is below the offer's allowance. The check runs in a `security definer` function, not client-side.
- A guardian can read everything their linked student can read, through an active `guardianships` row. Whether a guardian can also *write* (e.g. messages) is a WP2 safeguarding decision.
- A coach can message a student only inside an enrolment. There is no free-form coach-to-student discovery. This is a safeguarding control if minors are allowed.
- Library items are readable by any user with at least one active enrolment. Only admins, and a coach for their own items, can write them.
- `coach_offers` and coach profiles are world-readable, so students can browse and choose. `coaches.stripe_account_id` is readable only by that coach and admins.
- `billing_customers`, `stripe_events` and `enrolments.stripe_*` columns are written only by the service role (the webhook Edge Function). Clients never write billing state.
- `audit_log` and `consent_records` are insert-only through definer functions. There is no UPDATE or DELETE policy for any role.
- Roles are put into the JWT with Supabase's custom access token hook [12], so policies can check `auth.jwt()->>'user_role'` without a join. Relationship checks (the coach–enrolment check) still use the tables.

## 4. Billing model and provider

### Provider: Stripe Connect (marketplace)

Paddle and Lemon Squeezy are excluded. Paddle's acceptable use policy disallows "pure consulting or advisory services, including ... coaching" and "digital marketplaces" that let non-Paddle sellers sell [13]. Lemon Squeezy prohibits "services of any kind, including ... consulting" [14].

**Account type.** Stripe now labels Standard, Express and Custom as *legacy* and recommends Accounts v2 / controller properties for new platforms [15]. The legacy names still describe the behaviours [15]:
- Express-equivalent (Stripe-hosted onboarding and KYC, the lightweight Express Dashboard, platform sets payout timing, platform liable for disputes) fits this product. Coaches are individuals, not experienced online merchants.
- Standard-equivalent (full Dashboard, direct charges only, coach liable) suits coaches who run their own businesses. It gives up platform control of pricing and the student experience.

Coaches' identity documents go to Stripe, not to us.

**Charge type.** Use **destination charges**. The customer and price live on the platform, `transfer_data[destination]` routes funds to the coach, and `application_fee_percent` takes the platform's cut on each subscription invoice [16].
- Stripe states that with destination charges "the platform is the merchant of record" [16]. Refunds and chargebacks debit the platform balance, and the platform can then reverse the transfer [17].
- Adding `on_behalf_of` makes the coach the "business of record" (settlement merchant and statement descriptor) [17]. That is relevant to VAT agency, below.

**Payout timing (UK).** The first payout comes 7 calendar days after the first live payment. After that the default is 3 business days [18].

**UK fees** [19][20]:
- Standard UK cards 1.5% + 20p. Premium UK cards 2.8% + 20p. EEA cards 2.5% + 20p. International cards 3.15% + 20p, plus 2% for currency conversion.
- Stripe Billing: 0.7% of Billing volume (pay-as-you-go).
- Connect, when the platform handles pricing: **£2 per monthly active account** (active means it received a payout that month) plus **0.25% + 10p per payout**.
- Stripe Tax, if used: 0.5% per transaction (no-code) or 40p (API), only where registered [21].

### Worked fee example (illustrative prices, see Interpretations)

| | Founder tier £60/month | Kimberly tier £35/month |
| --- | --- | --- |
| Card fee, standard UK card (1.5% + 20p) | £1.10 | £0.73 |
| Billing (0.7%) | £0.42 | £0.25 |
| **Stripe per transaction** | **£1.52 (2.5%)** | **£0.97 (2.8%)** |
| Same on a premium UK card (2.8% + 20p + 0.7%) | £2.30 | £1.43 |
| Platform fee at 20% | £12.00 | £7.00 |
| Coach receives | £48.00 | £28.00 |

Per coach per month, Connect adds £2 plus the payout fee. For a coach with 20 students on £35, that is £2 + (0.25% × £560 + 10p) = **£3.50**, or about 18p per student. The platform's gross margin on a £35 student is then about **£5.85 before VAT**.

### VAT (UK)

- **Threshold:** £90,000 of taxable turnover over a rolling 12 months, in force since 1 April 2024 [22].
- **Principal or agent is a question of fact.** HMRC's six indicators include:
  - the principal keeps title to the service;
  - the value of the agent's service is separately identifiable;
  - the intermediary does not alter the nature or value of what it arranges.

  HMRC looks "beyond the agreements at the wider picture" [23]. Acting in your own name makes you an undisclosed agent, treated as a principal [24].
- **Platform as principal.** The platform sells coaching in its own name, and Stripe destination charges without `on_behalf_of` look like this. The **whole price** counts toward the £90k threshold, and the supply is standard-rated at 20%. The private-tuition exemption does not help. It covers only an individual teacher "in a personal capacity ... on their own account and at their own risk", and not tuition supplied by a company [25][26].
  - At 100 students × £35 × 12 = £42k, the platform is below the threshold.
  - At 1,000 students it is £420k, well above. VAT of **£5.83 on each £35** then consumes nearly all of the ~£5.85 margin.
- **Platform as disclosed agent.** The coach supplies the student, and the platform arranges it for a commission. Only the **commission** counts toward the threshold: 1,000 students × £7 × 12 = £84k, just under. Each coach, as a sole trader teaching a subject "taught regularly in a number of schools" (music), may make **exempt** private-tuition supplies [26]. HMRC says contracting "through an intermediary organisation does not affect" that exemption [25].
- **Founder's own coaching.** If the founder coaches through a limited company, those supplies are not exempt [25]. The founder should coach as a sole trader or partner, separately from the platform company, if the exemption is wanted. This is for an accountant.
- **Exercise library.** Sold on its own, the library is most likely an electronically supplied service: standard-rated, and subject to EU OSS rules for EU consumers (**unverified**; no primary source fetched). Bundling it into a coach's subscription blurs the agency picture. This is flagged.
- **Design consequence.** Build the payments to support agency: destination charges **with `on_behalf_of`** (the coach is business of record and on the statement descriptor), the platform fee shown separately, and coach-facing terms naming the coach as supplier. `on_behalf_of` requires the coach's account to hold the card-payments capability, which means fuller KYC. The accountant decides this before launch.

### Pricing mechanic: recommendation

**One monthly Stripe subscription per enrolment (student × coach), priced by the coach's tier, with a submission allowance.** For example, 4 submissions per month, no rollover. Library access comes free with any active enrolment.
- It maps one-to-one onto a destination-charge subscription: one `transfer_data.destination` (the coach) and one `application_fee_percent`. There is no ledger to reconcile.
- "The founder costs more, Kimberly less" becomes simply different `coach_offers` rows and Stripe Prices.
- The allowance is enforced in our database (`submissions_used`), reset by the `invoice.paid` webhook. It is not metered in Stripe.
- Switching coach means cancelling at period end and starting a new enrolment.

Rejected alternatives:
- **Credit packs:** a pre-paid platform balance that is not tied to a coach creates stored-value and refund liabilities. It forces separate charges and transfers (a "more complex Connect integration" [17]) and makes the platform look like the principal.
- **Platform-wide monthly plan with coach choice:** the same principal problem, plus a revenue-allocation formula across coaches.
- **One-off per-submission purchases:** these can be added later as `mode=payment` Checkout sessions on the same connected account, for example "one extra review".

## 5. App store payments (decision 7, shared with WP3)

- **Apple.** Guideline 3.1.3(d) exempts only "**real-time** person-to-person services between two individuals (for example tutoring students ... fitness training)" [27]. Async recorded feedback is not real-time. 3.1.1 requires IAP to unlock "features or functionality ... access to premium content" [27], which covers the library. 3.1.3(b) lets multiplatform apps expose web purchases only "provided those items are also available as in-app purchases" [27]. 3.1.3(f) exempts "free apps acting as a stand-alone companion to a paid web based tool", if there is "no purchasing inside the app, or calls to action for purchase outside of the app" [27].
- **US.** Since the April 2025 injunction, US-storefront apps may include buttons and links to web purchase [27][28]. In December 2025 the Ninth Circuit upheld the contempt finding but found the blanket ban on any commission was not a properly limited sanction [29]. Apple's future US commission on linked purchases is therefore unsettled (**unverified** current status).
- **UK.** Apple and Google were designated with Strategic Market Status (Apple on 22 October 2025). A **steering conduct requirement** went to consultation on 30 June 2026, and responses were published on 14 August 2026 [30]. We found no final decision, so UK anti-steering rules still apply (**unverified** after 14 August 2026).
- **EU.** From 1 October 2026, link-outs pay Apple a 15% store services commission (10% for small businesses) on sales within 7 days of the tap [31].
- **Google Play.** Play Billing is required for digital content and subscriptions, including "education" [32]. Since 30 June 2026 the UK, EEA and US have a billing-choice programme. Alternative billing or web links carry a 0% billing fee, but Google's service fee (from 10%) still applies [33].

**Answer assumed:** a native iOS app **would** need IAP for any in-app purchase of coaching or library access. We rely on 3.1.3(f), with 3.1.3(a)-style account management as the fallback. The native apps are **login-only companions**: no prices, no purchase buttons, no "subscribe on our website" prompts (except in the US storefront, where links are allowed). All purchases happen in web Stripe Checkout. The database's `enrolments` table is the single source of entitlement for every client, so no client-side IAP receipt logic is ever needed. If Apple rejects the companion approach, the fallback is IAP at Apple's commission for iOS-originated purchases only, with prices raised to match. That decision belongs to WP3 and the lead.

## 6. Keeping out of financial data

- **SAQ A.** Stripe Checkout and Stripe.js/Elements "host all card data collection inputs within an iframe served from Stripe's domain", so card data "never touches your servers". Official mobile SDK UI components are treated the same way [34]. Writing our own card-handling code loses SAQ A eligibility [34]. The Customer Portal is Stripe-hosted, so card changes and cancellations never touch our pages [16].
- **What we store:**
  - `stripe_customer_id`, `stripe_subscription_id`, subscription `status`, `current_period_end`, `stripe_account_id` and onboarding status for coaches, and processed `event_id`s.
  - Optionally card brand and last 4 digits, which Stripe says are out of PCI scope [35]. We recommend not storing them.
  - No bank details and no coach ID documents. Stripe collects those in hosted onboarding.
- **Webhooks** [36]:
  - Verify the `Stripe-Signature` over the **raw body**.
  - Return 2xx quickly and process asynchronously.
  - Stripe retries for up to three days in live mode.
  - Events can arrive **out of order** and **more than once**. Record `event.id` in `stripe_events` with a unique constraint and skip duplicates.
  - Do not order events by `created`. Re-fetch the subscription from the API when state matters.
  - Listen to both scopes: the platform account (destination charges) and connected accounts (`account.updated`, `payout.failed`).

## 7. Auth specifics

- **Account types:**
  - Student: self-serve sign-up by magic link or email OTP, plus Google/Apple OAuth.
  - Coach: **invite-only**. An admin creates the invite (`inviteUserByEmail`), then assigns the role. The coach then completes Stripe-hosted Connect onboarding. The coach becomes listable only when `coaches.active` is true, meaning Stripe payouts are enabled and, if WP2 requires, the DBS check is recorded.
  - Admin: seeded, with MFA required.
  - Passkeys: enabled once Supabase's beta reaches GA [3].
- **Guardians (if decision 6 admits under-18s):**
  - The guardian registers first and creates the child's profile. A `guardianships` row links the two, backed by a `consent_records` row (who consented, which document version, when).
  - The child may get their own login, or use the platform only through the guardian's session. WP2 decides.
  - Payment is always the guardian's: the Stripe customer is the guardian.
  - Age is captured at sign-up. Minors can be flagged for stricter RLS (for example, coach messages visible to the guardian).
  - Whether to launch 18+ only waits for WP2.
- **Signed video playback:**
  1. The client calls a `playback-token` Edge Function with its Supabase JWT and an asset ID.
  2. The function verifies the JWT, then runs a SQL check with the same rules as RLS (the student owns it; or it is the assigned coach on an active enrolment; or a linked guardian; or a library item with any active enrolment).
  3. The function signs a short-lived host token and returns the playback URL.
  - On Mux, this is an RS256 JWT with `sub` = playback ID, `aud` = `v`, `exp` and `kid`, signed with a Mux signing key our server holds [37].
  - On Cloudflare Stream, it uses a local signing key (JWK), which avoids the rate-limited token API. `exp` is at most 24 hours [38].
  - Upload URLs are minted the same way. Recommended playback TTL is 1 to 4 hours. Asset IDs are never guessable by clients, but the token, not obscurity, is the control.

## Recommended stack

- **Database, auth and server logic:** Supabase Pro, London `eu-west-2`. Postgres with RLS, Supabase Auth (magic link / OTP, Google and Apple OAuth, MFA for admins and coaches, passkeys when GA), custom access token hook for roles, and Edge Functions for the Stripe webhook, playback-token minting and Connect onboarding links.
- **Payments:** Stripe Connect with Express-equivalent accounts (Accounts v2 / controller properties: Stripe-hosted onboarding, Express Dashboard, platform-set payouts), destination charges with `on_behalf_of` and `application_fee_percent`, Stripe Billing subscriptions (one per enrolment), Stripe Checkout for purchase, and the Customer Portal for self-service.
- **Pricing:** a per-coach tier, monthly, with a submission allowance and the library bundled.
- **Tax:** VAT structure (agent vs principal) confirmed by a UK accountant before launch. Stripe Tax only if the platform becomes VAT-registered or sells the library separately.
- **Native clients:** login-only companions. Web checkout is the only purchase path.
- **Exit path:** `pg_dump` to any Postgres. Stripe data stays with Stripe. Video on the host is referenced by asset ID.

## Interpretations to confirm

1. **"Real-time" in Apple 3.1.3(d).** We read async recorded feedback as *not* real-time, so the exemption does not apply. Apple may read "tutoring" more broadly. Confirm with WP3 and ideally an App Review pre-check.
2. **3.1.3(f) companion-app route.** Its examples (VoIP, cloud storage) are utilities. Whether a coaching app qualifies is our interpretation.
3. **Principal vs agent for VAT.** We read the product as capable of being structured as disclosed agency. HMRC decides on facts, not contracts [23]. **Needs a UK accountant.**
4. **Singing as a subject "taught regularly in schools"** for the private-tuition exemption. We assumed music qualifies. HMRC guidance does not name music [25][26].
5. **Destination charges' "merchant of record" vs VAT agency.** Stripe calls the platform MoR for destination charges [16], and that is in tension with an agency VAT position. We assumed `on_behalf_of` resolves this. Unconfirmed.
6. **Connect fee tier.** We assumed a platform using destination charges with Express-style accounts pays "platform handles pricing" (£2/active account + payout fees) [20].
7. **Illustrative prices** (£60 founder, £35 Kimberly, 20% platform fee, 4 submissions per month) are ours, not the founder's.
8. **Cost estimates** for Firebase, Neon, PocketBase and Supabase compute at 10,000 students are estimates, not quotes.
9. **Minors at launch.** We designed for guardian-linked accounts but did not decide whether under-18s are admitted. That waits for WP2 (decision 6).
10. **UK steering status** after 14 August 2026 was not confirmed.

## Sources

All accessed 2026-09-23.

1. CoachNow pricing: https://coachnow.com/pricing
2. Kajabi pricing: https://kajabi.com/pricing
3. Supabase passkeys (beta) changelog: https://supabase.com/changelog/46458-passkeys-for-supabase-auth-beta ; docs: https://supabase.com/docs/guides/auth/passkeys
4. Clerk pricing: https://clerk.com/pricing
5. Better Auth introduction: https://www.better-auth.com/docs/introduction
6. Supabase regions: https://supabase.com/docs/guides/platform/regions
7. Convex pricing: https://www.convex.dev/pricing
8. Supabase pricing: https://supabase.com/pricing
9. Firebase pricing: https://firebase.google.com/pricing
10. Neon pricing: https://neon.com/pricing
11. PocketBase docs: https://pocketbase.io/docs/
12. Supabase custom access token hook: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
13. Paddle, what am I not allowed to sell: https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle
14. Lemon Squeezy prohibited products: https://docs.lemonsqueezy.com/help/getting-started/prohibited-products
15. Stripe Connect account types (legacy): https://docs.stripe.com/connect/accounts
16. Stripe Connect subscriptions: https://docs.stripe.com/connect/subscriptions
17. Stripe Connect charge types: https://docs.stripe.com/connect/charges
18. Stripe payouts: https://docs.stripe.com/payouts
19. Stripe UK pricing: https://stripe.com/gb/pricing
20. Stripe Connect UK pricing: https://stripe.com/gb/connect/pricing
21. Stripe Tax UK pricing: https://stripe.com/gb/tax/pricing
22. GOV.UK, register for VAT / thresholds: https://www.gov.uk/register-for-vat ; https://www.gov.uk/government/publications/vat-increasing-the-registration-and-deregistration-thresholds
23. HMRC VTAXPER36820, six indicating factors of agency: https://www.gov.uk/hmrc-internal-manuals/vat-taxable-person/vtaxper36820
24. HMRC VTAXPER37950, undisclosed agents: https://www.gov.uk/hmrc-internal-manuals/vat-taxable-person/vtaxper37950
25. HMRC VATEDU40200, scope of private tuition exemption: https://www.gov.uk/hmrc-internal-manuals/vat-education-manual/vatedu40200 ; VATEDU40500 (limited companies): https://www.gov.uk/hmrc-internal-manuals/vat-education-manual/vatedu40500
26. VAT Notice 701/30, education and vocational training: https://www.gov.uk/guidance/vat-on-education-and-vocational-training-notice-70130
27. Apple App Review Guidelines (3.1.1, 3.1.3): https://developer.apple.com/app-store/review/guidelines/
28. Cravath, Epic v Apple Ninth Circuit summary: https://www.cravath.com/news-insights/epic-games-ninth-circuit-win-affirming-civil-contempt-finding.html
29. Ninth Circuit opinion, Epic Games v Apple, No. 25-2935 (11 Dec 2025): https://cdn.ca9.uscourts.gov/datastore/opinions/2025/12/11/25-2935.pdf
30. CMA case page, Apple's mobile platform: https://www.gov.uk/cma-cases/apples-mobile-platform
31. Apple, DMA and apps in the EU: https://developer.apple.com/support/dma-and-apps-in-the-eu/
32. Google Play payments policy: https://support.google.com/googleplay/android-developer/answer/9858738
33. Android Developers Blog, expanded billing choice (June 2026): https://android-developers.googleblog.com/2026/06/play-expanded-billing.html
34. Stripe PCI compliance guide: https://stripe.com/guides/pci-compliance
35. Stripe integration security guide: https://docs.stripe.com/security/guide
36. Stripe webhooks: https://docs.stripe.com/webhooks
37. Mux secure video playback: https://www.mux.com/docs/guides/secure-video-playback
38. Cloudflare Stream, securing your stream: https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/
