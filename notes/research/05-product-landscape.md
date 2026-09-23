---
title: "Product landscape, build vs buy, MVP flows, pricing and pilot"
type: research
status: draft
---

# Product landscape, build vs buy, MVP flows, pricing and pilot

Measured against [gtm-vision.md](../gtm-vision.md). All facts accessed 2026-09-23 unless noted. Numbered citations such as [S1] point to [Sources](#sources). USD prices are quoted as published. GBP conversions are not given because exchange rates were not researched.

## Summary

- **The model already exists and has a track record.** ArtistWorks has run "Video Exchange" (student video in, teacher video back) at $29.99/month since the 2000s [S1][S2]. 30 Day Singer and Singing Carrots bundle human feedback into cheap subscriptions [S5][S7]. **Pronto Me is the closest match to the founder's brief.** It is a web marketplace where performers, singers included, pay each named coach a different per-submission price ($15–45) for asynchronous feedback returned as voice memo, video or text [S10][S11]. No competitor found combines *a choir community*, *a warm-up library* and *a tiered bank of coaches* in one place. Distribution through the choir is Singology's edge, not technology.
- **Build vs buy: do not build yet.** Run a 12-week pilot on CoachNow (PRO at $49.99/month per coach, or Academy at $899/year for multiple coaches with Stripe billing) [S13]. It already does video submission, drawing-on-video review and unlimited voice-over replies [S14]. Its limits are weak branding, no confirmed per-coach price tiers inside one account, unverified audio quality, and unclear data export. Take payment through Stripe Payment Links outside the tool.
- **Pricing.** UK 30-minute lessons cost £18–32, and London runs 20–40% higher [S21]. The Musicians' Union rate is about £44–45.50/hour (**unverified** on the MU site) [S22]. Proposed monthly plans with 4 reviews: **standard coach £35–55**, **founder £65–95**. Single reviews: **£10–15 standard, £20–30 founder**. Proposed platform commission: **15–25%**, against Lessonface at 5–15% [S19] and Superprof at about 10% [S20].
- **Pilot.** 12–15 choir members, 2 coaches, 12 weeks, paid from week 1. Build beyond the MVP only if submission, turnaround, retention and willingness-to-pay thresholds are all met (see [Pilot plan](#pilot-plan)).

## Landscape

| Product | Model | Price (as published) | Feedback delivery | White-label | Copyrighted repertoire evidence |
|---|---|---|---|---|---|
| ArtistWorks (Video Exchange) | Async video library plus video exchange | Standard $19.99/mo; Premium $29.99/mo, which includes unlimited Video Exchanges [S1] | Teacher records a personalised reply video [S2] | No (their own brand) | Exchanges are **not private**: they join the course library and all Premium members can see them [S3]. No repertoire policy found. **Unverified** |
| Musora / Singeo | Async lesson library plus community | $30/mo or $279/yr (other tiers of $25/mo and $229/yr have been reported) [S4] | Peer and coach critique in community (**unverified** depth) [S4] | No | "Songs" costs extra ($30/yr) **because of music licensing** through Hal Leonard [S6] |
| Singing Carrots | Web and iOS app with AI pitch feedback; one human review per month on top tier | Plans hidden behind a quiz; reviews cite about $10–20/mo (**unverified**) [S7][S8] | Real-time pitch visualisation; teacher gives a monthly written breakdown of 1 song [S7] | No | Large song database claimed; licensing basis **unverified** |
| 30 Day Singer | Async course plus instructor video replies | $29/mo or $129/yr (secondary sources) [S5] | Instructor replies by video ("Full Access feature") [S9] | No | None found |
| Yousician (singing) | App with AI pitch scoring, no human coach | From $19.99/mo; $119.99/yr (varies by country) [S12] | Automated | No | Licensed artist catalogue sits in the higher "Premium+" tier [S12] |
| tonebase (Voice) | Masterclass video library; classical focus | $49.95/mo; $24.95/mo billed yearly; lifetime $695 (piano page, secondary) [S15] | Virtual masterclasses with artists; personalised feedback claimed (**unverified**) | No | Classical repertoire is largely public-domain compositions (interpretation) |
| Voice Lessons To The World | One-off vocal course plus YouTube; live lessons via New York Vocal Coaching | Prices not published on site [S16] | Pre-recorded course; live 1:1 sold separately | No | Original exercises only ("all-original") [S16] |
| TrueFire | Guitar library plus async private lessons (student uploads video, teacher assesses) | About $45 per 30 min or $70 per hour (secondary; **unverified**) [S17] | Video reply | No | None found |
| Lessonface | Live online lessons marketplace plus self-paced courses | Commission 15% on students it sources, 5% on students teachers bring [S19] | Live video; optional recording | No | None found |
| TakeLessons | Live lessons marketplace | **Closed.** Bought by Microsoft in 2021; last bookings 15 Aug 2024; site shut 15 Nov 2024 [S18] | — | — | — |
| Pronto Me | **Async per-submission marketplace** (acting, singing, dance) | $15–45 per submission, set per coach; no subscription [S10][S11] | Voice memo, video or written notes; 12 h to 2 day turnaround; optional follow-up round [S10][S11] | No | "For feedback purposes only"; no copyright guidance found [S10] |
| Make Singing Click / SingWell | Course plus group lesson plus async feedback | Club $120/mo with 2 video feedbacks; premium $750/mo with unlimited async (secondary) [S23] | Video feedback | No | None found |
| Singing Coach AI (launched Dec 2025) | AI-only analysis of uploaded songs | Free (3 reviews/mo) to $99.99/mo [S24] | Note-level pitch, vibrato, timing and breath report | No | Users upload any song; no policy found |
| CoachNow | **Async video coaching platform** (sport-first) | Analyze $9.99/mo; PRO $49.99/mo or $499/yr; Academy from $899/yr with multi-coach options [S13] | Drawing on video, side-by-side compare, **unlimited voice-overs**, CoachCam [S14] | Logo on emails and booking confirmations only [S25] | N/A |
| Trainerize | PT programming app | Pro from $23/mo; Video Coaching add-on $10/mo; Stripe payments $10/mo; branded app $169 setup [S26] | Client video comes in only **through messages**; the add-on is for coach-to-client streaming and live calls [S27][S28] | Custom-branded app (vendor listing) | N/A |
| TrueCoach | PT programming app | Site shows Starter $26.34/mo (5 clients), Standard $57.99/mo (20), Pro $136.99/mo (50). Third-party sites quote $19/$49/$99 [S29][S30] | Clients upload set videos in-app; coach comments [S30] | Custom-branded app on Standard and above [S29] | N/A |
| Everfit | PT programming app | Free for 5 clients; Pro $19–290/mo; Studio $105–430/mo; payments add-on $9/mo [S31] | Video and picture messages (client upload review **unverified**) | Logo and colours on Pro; full white-label on Enterprise only [S31] | N/A |
| Kajabi | Course, membership and community site | Basic $179/mo; Growth $249/mo; Pro $499/mo [S32] | No native review workflow | Own domain and brand | N/A |
| Teachable | Course site | Starter $39/mo plus 7.5% fee; Builder $89/mo; Growth $189/mo [S33] | No native review workflow | Own brand | N/A |
| Circle | Community platform | Professional $89/mo; Business $199/mo; 0.5–2% transaction fee [S34] | Posts and comments only | Own brand; branded app costs extra (**unverified**) | N/A |

### Notes

- **Closest competitor: Pronto Me.** It has a bank of named coaches, each with their own price and turnaround, async private submissions, and a web-first build with no app. It is US and performance/audition focused, with no exercise library and no ongoing weekly programme. Singology's difference is the *weekly relationship plus a curated warm-up library plus an existing community*.
- **Closest product shape: ArtistWorks.** Its library-plus-exchange loop is exactly the PT model applied to music. It turns every exchange into shared library content, which scales teaching but removes privacy [S3]. That trade-off matters for the copyright question (CTO question 2): public-to-members is a different exposure from private-to-coach.
- **Repertoire handling across the landscape.** The only explicit evidence is Musora and Yousician putting licensed song catalogues behind a separate paid tier [S6][S12]. Neither says how they treat *students singing* copyrighted songs in submissions. No async-feedback product found publishes a policy on this. Treat it as unresolved and defer to the legal research brief.
- **AI feedback is commoditising pitch scoring** (Yousician, Singing Carrots, Singing Coach AI). Reviews of AI coaches report glitches and wrong song identification (secondary) [S35]. The human coach relationship is the defensible part, which matches the CTO's framing ("the value is the remote, asynchronous relationship").
- **PT tools are a poor fit.** Trainerize does not natively attach client video to an exercise [S27]. Everfit and TrueCoach are built around sets, reps and nutrition. CoachNow is the only adjacent tool whose core object is "review a submitted video and reply by voice".

## Build vs buy

**Recommendation: do not build yet.** Launch the pilot on CoachNow in about 2 weeks. Build only if the pilot thresholds are met, and use pilot evidence to decide which limits actually hurt.

**Candidate setup (CoachNow):**

- **Option A, cheapest and cancellable:** one CoachNow PRO seat per coach at $49.99/mo each [S13]. That is 2 coaches ≈ $100/mo. Each coach runs their own Spaces (one per student). Payment is taken outside CoachNow through Stripe Payment Links, one link per coach tier, so the founder and standard price points are simple.
- **Option B, integrated billing:** CoachNow Academy at $899/yr with multi-coach roles (Coach, Admin Coach, Scheduler, Admin) and Stripe Connect packages and subscriptions [S13][S25]. It is an annual commitment. Whether each coach can set their own price inside one Academy is **unverified**. Multiple Academy accounts can share one Stripe account [S36]. Bulk discounts apply at 5+ coaches [S37].
- **Exercise library:** upload warm-up videos to the CoachNow library and share them into Spaces, or host privately on Vimeo and link. Use original vocalises only in the pilot so the repertoire question does not block launch.

**What CoachNow gives:** client video and photo upload into a private Space; coach annotation, side-by-side comparison, unlimited voice-over and CoachCam replies [S14]; iOS, Android and web [S38]; 300 GB storage on PRO and Academy [S13].

**Limits to check before committing (all found in research, none tested):**

1. **Branding.** Not white-label. Students see "CoachNow", which is sport-branded. Only logos in emails and booking confirmations are customisable [S25].
2. **Multi-coach pricing tiers.** Option A handles tiers outside the tool. Per-coach price points inside Academy are **unverified**.
3. **Audio quality.** CoachNow's compression and loudness handling for singing are **unverified**. It is built for visual sport analysis. Test in week 0: a sustained note, a fast run and a quiet head-voice passage recorded on one Android and one iPhone, then judge playback.
4. **Data export.** Individual videos can be exported or downloaded [S39]. A bulk export of Spaces, comments and student records is **unverified**. Keep the student roster, plan and payment status in a spreadsheet during the pilot, so moving off CoachNow later only means re-uploading media.
5. **Audio-only review.** No waveform or pitch view. All review is video-centric.
6. **Payments fee.** Any CoachNow cut on Stripe Connect payments is **unverified** [S36].

**Fallback if the audio test fails:** a no-tool pilot. Students upload to a private shared folder per student (for example Google Drive), and coaches reply with a voice memo or a Loom video. It costs nothing, is ugly, and is enough to measure the loop.

**Why not Kajabi, Teachable or Circle:** they host the library and take payments well, but have no submission-and-review object. Coaches would be reviewing through comments or email. Cost is $89–179+/mo before any review tooling [S32][S33][S34].

## MVP flows

These are the minimum flows for a custom build *after* the pilot. The pilot uses CoachNow's equivalents.

### Student onboarding

1. Land from choir channel with an invite code (captive audience first; public sign-up later).
2. Short voice profile: voice type if known (soprano/alto/tenor/bass/unsure), experience, goals, and a 30-second baseline recording.
3. Choose coach: card per coach with photo, 60-second intro video, specialism, turnaround promise (in the style of Pronto Me [S10]) and price tier (founder or standard).
4. Choose plan: monthly subscription (4 reviews) or single review. Pay through Stripe Checkout.
5. Land on "This week": first assigned warm-ups plus a prompt to record.

### Student weekly loop

1. Open "This week": 2–4 assigned exercises from the library, each with a demo video and a backing audio track.
2. Practise, then record in-app or upload. **Audio-first capture** (video optional) at uncompressed or high-bitrate audio.
3. Add a note ("struggling with the break at E4") and submit. Show the turnaround promise.
4. Get a notification (email, plus push if an app exists) when feedback lands.
5. View feedback: coach's audio or video reply, timestamped comments pinned to the student's own recording, and next week's exercises.
6. **A/B compare** this week against baseline or any previous week, same exercise.

### Coach loop

1. Review queue sorted by oldest submission, with an SLA timer per item.
2. Open a submission: waveform (plus video if present), student note, and the previous submission for the same exercise.
3. Drop **timestamped comments on the waveform**. Loop a region; slow playback without pitch change.
4. Record a reply: voice memo, or talking-head video (CoachCam pattern [S14]).
5. Assign next week's exercises from the library (by voice type and goal), then send.

### Singing-specific differentiators (in priority order)

1. **Audio-first review** with a waveform, region looping and time-stretch. PT tools centre on visual form; singing is judged by ear.
2. **A/B compare with previous weeks** on the same exercise. This is the audible proof of progress that drives retention (the CoachNow side-by-side pattern, applied to audio [S14]).
3. **Progress timeline**: one row per exercise, with a playable history.
4. **Warm-up library filtered by voice type and range**, with exercise backing tracks transposable per voice (PT libraries are one-size).
5. **Pitch trace overlay** (optional, later). This is AI territory where competitors are already strong [S7][S12][S24]. Useful as a visual aid for the coach, not a replacement.

## Pricing

**UK benchmarks (private lessons):**

- 30 minutes: **£18–32**; 60 minutes £35–65; London and the South East 20–40% higher; online priced the same or slightly below in-person [S21].
- Another 2026 sample gives a median 30-minute price of £21.25 (secondary, **unverified** methodology) [S22].
- Musicians' Union recommended rate: reported as £44/hour (2025/26) and £45.50/hour (2026–27). Both figures come from secondary sources and are **unverified** on the MU site [S22].

**Async benchmarks:**

- Per submission: Pronto Me $15–45, set per coach [S10][S11].
- Subscription with unlimited or bundled feedback: ArtistWorks Premium $29.99/mo [S1]; 30 Day Singer $29/mo [S5]; Make Singing Click $120/mo for 2 feedbacks (secondary) [S23]; Singing Carrots bundles 1 teacher review per month in its top tier [S7].
- AI-only: $0–99.99/mo [S24].

**Proposed Singology prices (GBP, including VAT if applicable, which is an open question):**

| Plan | Standard coach tier | Founder tier |
|---|---|---|
| Monthly plan: 4 reviews/month (one per week) plus full library | **£35–55/mo** | **£65–95/mo** |
| Single review (plus library for 30 days) | **£10–15** | **£20–30** |
| Library only (no reviews) | £5–10/mo | — |

Rationale: an async review of a 3–5 minute submission takes roughly 10–15 minutes of coach time (**unverified** assumption; measure it in the pilot). Four reviews ≈ 40–60 minutes ≈ one lesson hour (£35–65 [S21]), sold at or slightly below that price because it is flexible and asynchronous. The founder tier carries a roughly 1.7–2× premium, mirroring the spread between Pronto Me's cheapest and dearest coaches ($15–$45) [S10].

**Platform commission for the coach marketplace: 15–25% of coach revenue.** Comparables: Lessonface 15% on students it sources and 5% on students teachers bring [S19]; Superprof about 10% on platform-paid lessons [S20]. Singology supplies the students (the choir), the library and the tooling, which justifies the upper half more than Lessonface's teacher-sourced rate. Consider 10% for students a coach brings in. Stripe fees come on top.

## Pilot plan

**Size:** 12–15 choir members, 2 coaches (founder plus one standard coach), 12 weeks. Paid from week 1 at a "founding member" price inside the proposed ranges; charging tests willingness to pay directly.

**Sequence:**

1. **Week −2:** pick the tool (CoachNow Option A) and run the audio test. Record 8–10 original warm-up videos (breath, onset, range, agility), roughly 3 per week of content at first.
2. **Week −1:** announce to the choir with a short signup form: voice type, goal, preferred coach, and the price they would pay. Count sign-ups against places to measure demand.
3. **Weeks 1–4:** weekly loop. Coaches log minutes spent per review.
4. **Week 4 checkpoint:** 4-week retention; a 5-minute survey; adjust exercises and turnaround.
5. **Weeks 5–12:** continue, and introduce the single-review option to lapsed members.
6. **Week 12:** retention, willingness-to-pay survey at the full proposed price, coach economics review, go/no-go decision on building.

**Metrics and thresholds that justify building beyond the MVP (all must hold):**

| Metric | Threshold |
|---|---|
| Demand: sign-ups ÷ pilot places | ≥ 2× (waitlist exists) |
| Weekly submission rate (active students who submitted that week) | ≥ 70% average |
| Coach turnaround, median | ≤ 72 hours; 90% within 5 days |
| Coach minutes per review | ≤ 15 min (else the pricing breaks) |
| Retention at 4 weeks | ≥ 80% still paying |
| Retention at 12 weeks | ≥ 60% still paying |
| Willingness to pay at full price (stated at week 12) | ≥ 50% of retained members |
| Tool friction | ≥ 3 recurring complaints that only a custom build fixes (e.g. audio quality, branding, per-coach pricing) |

If demand and retention hold but tool friction does not, **stay on the bought tool** and grow the coach bank instead of building.

## Interpretations to confirm

1. **UK location** was assumed, as the brief instructed. Prices are in GBP. VAT treatment and registration status are unknown.
2. **Choir size is unknown.** The pilot size of 12–15 is my choice. If the choir has fewer than about 40 interested members, shrink to 8–10.
3. **"Founder tier" and "standard-coach tier"** are read as two price levels set by the platform, not prices each coach sets freely. The vision says members "pay a little bit more" for the founder. Whether coaches set their own prices is undecided.
4. **The commission applies to non-founder coaches.** How the founder's own revenue is treated is not stated.
5. **Coach time per review (10–15 min)** is an estimate. It drives the pricing and must be measured.
6. **Pilot uses original exercises only** to sidestep repertoire copyright. This is a sequencing choice, not a legal conclusion. The legal position belongs to the copyright brief.
7. **TrueCoach prices conflict:** the live site shows $26.34/$57.99/$136.99, while third parties quote $19/$49/$99. This may be regional display or a price rise; **unverified**.
8. **Singing Carrots iOS launch date conflicts** across sources (17 June 2026 vs July 2026); **unverified**.
9. **AI feedback features** are listed as a later option. The vision does not mention AI, so treat them as out of scope unless the founder wants them.
10. **"Kimberly"** in the vision is taken to be an example of a standard-tier coach, not a confirmed pilot coach.

## Sources

All accessed 2026-09-23.

- [S1] ArtistWorks: How much does it cost? https://intercom.help/artistworks-help-center/en/articles/11780634-how-much-does-it-cost
- [S2] ArtistWorks: What is a Video Exchange? https://intercom.help/artistworks-help-center/en/articles/11585088-what-is-a-video-exchange
- [S3] ArtistWorks: Are my Video Exchanges private or visible to others? https://intercom.help/artistworks-help-center/en/articles/11780673-are-my-video-exchanges-private-or-visible-to-others
- [S4] Singeo: https://www.singeo.com/ and Singeo review (Bloom Vocal, secondary): https://www.bloomvocal.site/en/blog/singeo-review-2026
- [S5] 30 Day Singer review (secondary): https://amvocalstudios.com/post/30-day-singer-review/ ; https://onlinesinginglessonsco.com/30-day-singer-pricing/
- [S6] Musora: Why is there an extra cost for "Songs"? https://help.musora.com/article/991-why-is-there-an-extra-cost-for-musora-songs
- [S7] Singing Carrots pricing: https://singingcarrots.com/pro
- [S8] Singing Carrots review (secondary): https://www.bloomvocal.site/en/blog/singing-carrots-review-2026
- [S9] 30 Day Singer feedback: https://www.30daysinger.com/feedback
- [S10] Pronto Me: https://pronto.me/
- [S11] Pronto Me vocal coach feedback: https://pronto.me/vocal-coaches-feedback
- [S12] Yousician pricing (secondary): https://www.guitarchalk.com/yousician-cost/ ; https://www.bloomvocal.site/en/blog/yousician-review-2026
- [S13] CoachNow pricing: https://coachnow.com/pricing
- [S14] CoachNow Voice Over: https://help.coachnow.io/en/articles/6745667-voice-over ; features: https://coachnow.com/coach-features
- [S15] tonebase pricing (piano page; voice page failed to load): https://www.tonebase.co/piano/pricing ; https://voice.tonebase.co/pricing
- [S16] Voice Lessons To The World: https://voicelessonstotheworld.com/
- [S17] TrueFire review (secondary): https://www.guitarworld.com/reviews/truefire-review
- [S18] TakeLessons (Wikipedia): https://en.wikipedia.org/wiki/TakeLessons ; https://blog.tunelark.com/takelessons-shut-down-alternatives/
- [S19] Lessonface fees (page returned 403; figures from search snippet of this page and https://www.lessonface.com/about-teaching): https://www.lessonface.com/content/lessonface-fees-and-formats
- [S20] Superprof fees (secondary): https://itutoronline.com/blog/itutoronline-vs-superprof ; https://www.superprof.com/blog/how-superprof-works/
- [S21] LessonLoop, UK music lesson prices 2026: https://lessonloop.net/blog/music-lesson-prices-uk/
- [S22] UK singing lesson cost and MU rates (secondary): https://www.tutorlab.uk/q/how-much-do-singing-lessons-cost-uk ; https://junocal.com/blog/how-much-to-charge-for-music-lessons
- [S23] SingWell, best online singing course (secondary): https://singwell.eu/best-online-singing-course/
- [S24] Singing Coach AI: https://singingcoach.ai/
- [S25] CoachNow Academy 101: https://help.coachnow.io/en/articles/10809209-coachnow-academy-101
- [S26] Trainerize pricing: https://www.trainerize.com/pricing/
- [S27] Trainerize idea forum, client form video upload: https://ideas.trainerize.com/forums/167887-coach-trainer-abc-trainerize/suggestions/38395417-allow-clients-to-upload-video-of-their-form
- [S28] Trainerize video coaching: https://www.trainerize.com/features/video-coaching/ ; https://help.trainerize.com/hc/en-us/articles/360041685192-Video-Coaching-Add-on
- [S29] TrueCoach pricing: https://truecoach.co/pricing/
- [S30] TrueCoach pricing and features (secondary): https://arvo.guru/vs/truecoach ; https://coachway.io/articles/truecoach-review/
- [S31] Everfit pricing (secondary): https://coachway.io/articles/everfit-pricing/
- [S32] Kajabi pricing (secondary): https://www.schoolmaker.com/blog/kajabi-pricing
- [S33] Teachable pricing (secondary): https://www.schoolmaker.com/blog/teachable-pricing ; https://www.teachable.com/pricing
- [S34] Circle pricing (secondary): https://schoolmaker.com/blog/circle-so-pricing ; https://circle.so/pricing
- [S35] Singing Coach AI review (secondary): https://www.bloomvocal.site/en/blog/singing-coach-ai-review-2026
- [S36] CoachNow billing through Stripe Connect: https://help.coachnow.io/en/articles/12270037-billing-through-stripe-connect ; https://help.coachnow.io/en/articles/12610547-connect-multiple-coachnow-academy-accounts-to-one-stripe-account
- [S37] CoachNow bulk discounts: https://help.coachnow.io/en/articles/374995-bulk-discounts-for-multi-coach-businesses-schools-or-orgs
- [S38] CoachNow on Google Play: https://play.google.com/store/apps/details?id=com.edufii&hl=en
- [S39] CoachNow sharing and export: https://help.coachnow.io/en/articles/8534039-how-do-i-share-the-videos-i-make-in-coachnow-analyze
