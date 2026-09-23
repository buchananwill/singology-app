---
title: "Research brief 03: Client stack (web-first vs native iOS)"
type: research
status: draft
---

# Research brief 03: Client stack (web-first vs native iOS)

Answers CTO question 3 in [gtm-vision.md](../gtm-vision.md) and carries journal decisions 4 (audio fidelity) and 7 (app store payment rules) from [gtm-journal-01.md](../gtm-journal-01.md). All web sources accessed 2026-09-23; citations are `[Sn]` links resolved in [Sources](#sources).

## Summary

**The counter-argument in its strongest form.** The core product loop is: a student plays an exercise, sings along in headphones, and the platform captures their voice cleanly, then delivers a 5 to 30 minute weekly upload without babysitting. On iPhone, every step of that loop is controlled by an audio session that only native code can configure. A native app can pick `.measurement` mode to minimise system processing, route playback to headphones while recording from a chosen mic, accept a USB interface, and hand a large file to a background `URLSession` that finishes after the student locks the phone. A web page gets whatever WebKit decides. WebKit's own bug history shows the `echoCancellation` constraint once did nothing on Safari, and residual filtering was reported after it was "fixed" [S5]. There is no Background Fetch on iOS Safari [S10], and uploads die with the tab. iPhones are 51% of UK and 61% of US mobile traffic [S21][S22] and about 70% of app-store consumer spend [S23]. So the first-class requirement (decision 4) is weakest on the platform most paying students use.

**Verdict.** Web-first is still reasonable, on three conditions. (1) Audio fidelity on iOS Safari is measured with real devices before launch, not assumed. (2) The iOS default capture path is chosen by that test: in-page MediaRecorder or the native Camera app via `<input capture>`. (3) Uploads are chunked and resumable. Web-only also avoids Apple's payment rules completely. Asynchronous coaching probably does **not** qualify for the 3.1.3(d) exemption, and Apple has rejected a login-only coaching companion app under 3.1.1 [S1][S31]. Plan a **Capacitor shell** as stage 2, reusing the web UI and adding a native recorder and background upload. It is built on cloud macOS CI for about £0 to £30 a month plus a $99/yr developer fee. It is triggered by the metrics in [Decision triggers](#decision-triggers).

## 1. The steelman for native iOS (and native in general)

Each point below says what native does better, whether that matters for *this* product, and how strong the point is.

### 1.1 Recording quality and control (strongest point)

- **Audio session control.** A native app sets the `AVAudioSession` category and mode. `playAndRecord` with `.measurement` mode is Apple's documented way to get "the minimal amount of system-supplied signal processing" on input and output routes [S14]. It disables voice processing (echo cancellation, AGC, noise suppression) on the I/O unit [S15]. A web page can only *request* this through `getUserMedia` constraints. What WebKit actually does with them is an implementation detail: see §2.2.
- **Sing-along while recording.** This is the most product-specific argument. A vocal exercise means playing a guide track into headphones while recording the voice. Natively, the app sets category options (for example, allow A2DP Bluetooth output while recording from the built-in mic, or prefer wired headphones) and handles route changes. On iOS Safari, developers report that starting mic capture forces audio output from headphones to the speaker [S16]. That feeds the backing track straight into the mic, which is exactly the situation where echo cancellation then "helps" and damages the voice. **Unverified** whether this is still true on iOS 26. It must be tested (see §2.7).
- **Sample rate and format.** Native code can record 48 kHz PCM/ALAC and choose mono or stereo. iOS itself caps the hardware mixer at 44.1/48 kHz even with USB devices [S17], so native gains nothing above 48 kHz. That is fine for voice. Since Safari 18.4, the web can also record PCM and ALAC through MediaRecorder [S6], so **format is no longer a native advantage**. Input *processing* is.
- **External mics and interfaces.** Class-compliant USB-C/Lightning interfaces (for example Focusrite, iRig, Shure MV88) appear as audio routes. Native apps can list and select them (`availableInputs`, `setPreferredInput`) and read the channel count. The web gets `enumerateDevices()` plus whatever route iOS picks. **Unverified** how reliably iOS Safari exposes and holds a USB interface as the input. Relevance: most choir-member students will use the built-in mic; this matters to the ambitious minority and to coaches recording feedback.
- **Camera control.** Natively: lock exposure, focus, frame rate and lens, and pick 1080p/30 explicitly. The web gets `getUserMedia` video constraints with less control. For a singing coach, posture and jaw are visible at 720p. **Low importance.**

### 1.2 Background and resumable upload of large files

- Native: a background `URLSession` upload task is handed to a system daemon. It continues while the app is suspended and is relaunched on completion. It stops if the user force-quits [S18]. Capacitor plugins expose this to web code (Capawesome File Transfer, Capgo Uploader) [S19][S20].
- Web: iOS Safari has **no Background Fetch API** in any version through 27.2 [S10]. A `fetch`/XHR upload runs only while the page is in the foreground. When the screen locks or the user switches apps, it pauses or fails [S30].
- Scale: a 30-minute weekly total is typically split into several clips. At the decision-3 tier of 720p/2.5 Mbps, that is about 1.1 GB per hour, so about 560 MB a week. A single 5-minute clip is about 95 MB. On 4G or home Wi-Fi, one clip takes about 30 s to 3 min in the foreground. **Papercut, not blocker,** *if* uploads are chunked and resumable (tus or S3 multipart) and the UI says "keep this screen open". It becomes a blocker if clips are captured by the native Camera app at native bitrates (see §2.6), because those files are several times larger.

### 1.3 Reliable push ("your coach replied")

- Native: APNs, no install friction, about 60 to 80% opt-in on iOS (industry folklore, **unverified**).
- Web: Web Push works on iOS 16.4+ **only for Home Screen web apps**, after a user-gesture permission prompt [S8]. Declarative Web Push (iOS 18.4+) removes the service-worker dependency and is more reliable [S7][S9]. iOS 26 opens every site added to the Home Screen as a web app by default [S11], which lowers the barrier. The remaining cost is the funnel: the student must know to do Share, then Add to Home Screen. Email fallback covers the gap for an async product whose turnaround is measured in days. **Papercut.**

### 1.4 Offline caching of exercise videos

- Native: download to app storage, which is never evicted.
- Web: Safari 17+ gives Home Screen web apps up to 60% of disk per origin. `persist()` is granted by heuristics, including whether the site is installed. Best-effort data can be evicted LRU under storage pressure [S12]. Caching 20 h of library video is neither needed nor sensible. Caching "this week's 3 exercises" (about 100 to 300 MB) is feasible on the web for installed users. **Papercut.** Offline is not a core need; students practise at home on Wi-Fi.

### 1.5 App Store discoverability, trust and retention

- A store listing lends legitimacy ("is this a real thing?") and a home-screen icon drives habitual return. **Unverified quantitatively.** Retention studies comparing PWA and native for the same product are vendor-published and not rigorous.
- Counterpoint specific to this product: acquisition is the founder's choir community and personal brand ([gtm-vision.md](../gtm-vision.md)), not store search. A non-game niche coaching app gets little organic App Store traffic. **Moderate for trust, low for discovery.**

### 1.6 iPhone demographics and spend

- Mobile OS share, August 2026: **UK iOS 51.5% / Android 48.5%** [S21]; **US iOS 60.7% / Android 39.3%** [S22].
- App store consumer spend 2025: the App Store took **about 70.5%** of combined iOS plus Google Play spend [S23].
- Musicians specifically: no rigorous survey found. Industry commentary says iOS dominates mobile music-production software because of Core Audio and GarageBand [S24]. **Unverified** for singers or choir members. The honest reading: iPhone users are at least half of Singology's likely students and are over-represented among people who pay.

### 1.7 What native does *not* buy

- It does not make coaching better. The CTO's point that "the value is the remote, asynchronous relationship" stands.
- It adds app-store payment exposure (§4), review delays, and a second release train.

## 2. The real state of iOS Safari / PWA in 2026

| Capability | State on iOS Safari (2026) | Blocker or papercut |
|---|---|---|
| MediaRecorder | Supported. Since 18.4: WebM (Opus, VP8/VP9), fragmented MP4, **ALAC and PCM lossless audio**, H.264/HEVC/AV1 [S6] | Fine |
| Disable voice processing (`echoCancellation`, `noiseSuppression`, `autoGainControl`) | `echoCancellation:false` was a no-op until fixed in 2019. The reporter then saw a residual ~12 kHz low-pass [S5]. Current per-constraint behaviour on iOS is **unverified** (see 2.2) | **Potential blocker. Must test.** |
| Headphone sing-along while recording | Reports of output being forced to the speaker when mic capture starts [S16] | **Potential blocker. Must test.** |
| Web Push | iOS 16.4+, Home Screen only, user gesture [S8]. Declarative Web Push 18.4+ [S7] | Papercut |
| Install | iOS 26: any site added to the Home Screen opens as a web app by default [S11] | Papercut (discoverability of the gesture) |
| Storage | Up to 60% of disk per origin. `persist()` is heuristic. LRU eviction under pressure [S12] | Papercut |
| Background upload | No Background Fetch [S10]. Uploads stop when backgrounded [S30] | Papercut with resumable chunked upload |
| EU DMA | Apple planned to remove Home Screen web apps in the EU in iOS 17.4, then **reversed** on 1 March 2024 [S13] | Residual policy risk (see 2.5) |
| `<input type=file capture>` | Hands off to the native Camera. Resolution and compression behaviour has changed across iOS versions [S25][S26] | Viable fallback (see 2.6) |

### 2.1 MediaRecorder and codecs

Since Safari 18.4 (iOS, iPadOS, macOS, visionOS), MediaRecorder can produce WebM/Opus, fragmented MP4, and lossless ALAC or PCM audio [S6]. Codec choice is no longer the problem. Recommended format: fragmented MP4 with AAC at 128 to 192 kbps, or Opus, for the upload tier in decision 3. Lossless PCM is an option for audio-only submissions (about 5.2 MB/min mono 44.1 kHz 16-bit).

### 2.2 Can voice processing actually be disabled on iOS Safari?

- WebKit bug 179411 ("getUserMedia echoCancellation constraint has no affect") was fixed in November 2019. A WebKit engineer advised calling `applyConstraints({echoCancellation:false})` on the track. The reporter then observed a **residual low-pass around 12 kHz** that no exposed constraint removed [S5].
- The addpipe constraints reference (tests from the Safari 11 era) lists `noiseSuppression` and `autoGainControl` as unsupported on Safari and `sampleRate` as fixed at 44.1 kHz [S4]. **Unverified** for Safari 26. MDN/BCD data could not be retrieved during this research.
- A 2026 report tested all three set to false inside a WKWebView (Capacitor) and still had broken audio analysis. They fixed it with a native AVAudioEngine plugin [S28]. That is a WKWebView plumbing issue, not proof of voice processing, but it shows the same direction: when audio matters on iOS, teams end up native.
- **My understanding (unverified, from WebKit architecture knowledge, not a primary source):** on iOS, WebKit toggles between Apple's voice-processing I/O unit and the plain I/O unit based on `echoCancellation`. `noiseSuppression` and `autoGainControl` are not independently controllable; they ride along with it. If that is right, `echoCancellation:false` is the one switch that matters, and it should give near-raw audio.
- **Assessment:** this is the single gap that could be a real blocker. It is resolvable only by measurement (see §2.7).

### 2.3 Web Push on iOS

Available since 16.4 for Home Screen web apps. Permission must follow a user gesture [S8]. Declarative Web Push (18.4+) lets the browser display notifications without running a service worker [S7][S9]. For "your coach replied", declarative push plus email is sufficient. **Papercut.**

### 2.4 Storage quotas and eviction

Safari 17+: an origin may use up to 60% of disk in browser apps and Home Screen web apps. Overall use is capped at 80%. Eviction is LRU by origin under pressure. Persistent mode is granted heuristically, favouring Home Screen web apps [S12]. Keep recordings in IndexedDB/OPFS only until the upload is confirmed. **Papercut.**

### 2.5 EU DMA PWA saga

In the iOS 17.4 betas, Apple removed Home Screen web apps for EU users, citing the cost of supporting alternative browser engines. After regulatory pressure, Apple reversed this on 1 March 2024, keeping WebKit-based web apps [S13]. Singology is UK-primary (decision 5) and the UK is outside the DMA. The episode is evidence that **PWA capability on iOS exists at Apple's discretion**. That is a strategic risk, not a current gap.

### 2.6 File-picker fallback: record in the Camera app via `<input capture>`

- `<input type="file" accept="video/*" capture>` opens the native Camera. The file comes back to the page and the page uploads it.
- **Advantages:** Apple's camcorder audio pipeline, with no WebRTC voice-processing unit (**unverified**: newer iPhones apply Camera-app processing such as wind noise reduction, which is user-configurable). Also no MediaRecorder code, and recording works even if the page crashes.
- **Disadvantages:**
  1. The guide or backing track cannot play from the page while the Camera records. The page is not running, and the Camera app likely pauses other audio (**unverified**).
  2. Historic behaviour: iOS compressed picked videos to 720p, for example 886 MB down to 96 MB [S25]. Later iOS versions pass the original HEVC `.mov` through [S26]. Either can surprise you: over-compression or a multi-GB upload.
  3. Upload still happens in a foreground tab.
- **Verdict:** a good fallback for "sing unaccompanied / sing to a track on another device". It is not a substitute for in-app sing-along recording.

### 2.7 Required pre-launch test (the whole verdict depends on it)

Test on at least three iPhones (for example iPhone 12, 15 and 17) and one Android device, in Safari and as a Home Screen web app:

1. Record a 20 Hz to 20 kHz sine sweep and a pianissimo-to-fortissimo sung phrase, with `echoCancellation`, `noiseSuppression` and `autoGainControl` all false. Compare against the Voice Memos app. Look for the spectral ceiling (the ~12 kHz question), gain pumping, and gating of quiet onsets.
2. Repeat while playing a backing track from the page into wired headphones, then Bluetooth headphones. Check where the output goes and whether the track bleeds into the recording.
3. Repeat with a USB-C interface.
4. Upload a 5-minute clip, lock the screen at 50%, and reopen. Confirm the resumable upload recovers.

Cost: one or two days of work plus borrowed iPhones. Choir members can lend devices.

## 3. Middle paths

| Path | Code reuse with a web frontend | Native audio access | iOS build without a Mac | Maturity (2026) |
|---|---|---|---|---|
| **Capacitor** (wrap the web app in WKWebView) | Very high: same web UI | Via plugins. Write a small Swift recorder plugin (AVAudioSession `.measurement` + AVAudioRecorder) and use background-upload plugins [S19][S20] | Needs Xcode. Build on cloud macOS CI | Mature. Note App Review 4.2 "repackaged website" risk [S2]: native recording and upload make it defensible |
| **Expo / React Native** | Medium: shared logic and types. UI rewritten in RN (or react-native-web) | Good (expo-audio, community modules, custom native modules) | **Best:** EAS Build compiles and signs in the cloud. Free plan 15 iOS builds/month; Starter $19/mo plus $2 to $4 per build [S32] | Mature |
| **Kotlin / Compose Multiplatform** | Low with a web frontend (Compose for Web is separate). High with the existing Android app | Full (Kotlin/Native calls AVFoundation directly) | iOS targets **require a macOS host with Xcode** [S33]. Use macOS CI | Compose for iOS is **stable since 1.8.0 (May 2025)** [S34]; 1.11.0 released May 2026 [S35] |
| **Flutter** | Low (Dart UI, Flutter web is weak for content sites) | Good via plugins | Needs macOS. Codemagic is the usual route | Mature |

**Recommendation among middle paths:** Capacitor, if the product is web-first, because it reuses about 90% of the code (estimate). KMP/Compose is attractive *only* if the CTO decides the Android app is the product and the web is secondary. That would be the opposite of the stated web-first stance, and it doubles the UI surface.

### 3.1 iOS build path without owning a Mac: costs

| Option | Cost (2026) | Notes |
|---|---|---|
| Apple Developer Program | **$99/yr** [S36]. Fee waiver only for non-profits, education and government, and **not** if selling digital goods or services [S37] | Needed for TestFlight and the App Store. TestFlight is included |
| GitHub Actions macOS runner | **$0.062/min** from 1 Jan 2026 [S38]. Free on public repos. Private free tier minutes count at a 10x multiplier (**unverified** detail) | A 15-min Capacitor or KMP build costs about $0.93. 40 builds/month is about $37 |
| Codemagic | **500 free M2 min/month**, then $0.095/min (M2) or $0.114/min (M4) [S39] | Free tier covers about 30 builds a month. Good fit for KMP, Flutter and Capacitor |
| Expo EAS Build | Free: 15 iOS builds/month. Starter $19/mo [S32] | Expo/RN only |
| Xcode Cloud | **25 compute h/month included** with the developer program. 100 h costs $49.99/mo [S40] | Initial workflow setup is done in Xcode (**interpretation:** it needs a Mac once) |
| MacinCloud | About $1/h pay-as-you-go; managed about $25 to $29/mo; dedicated M2 $99/mo [S41] (**unverified**: secondary summary) | Interactive remote Mac for Xcode-only chores (first signing setup, debugging) |
| AWS EC2 Mac (mac2.metal) | About **$0.65/h**, **24-hour minimum** per dedicated-host allocation [S42][S43] | At least $15.60 per use. About $475/mo if left running. Poor fit |
| **Floor: own hardware** | Refurbished Mac mini M1 from about **£245** [S44]; refurbished iPhone 12 from about **£156** [S45]. About **£400 total** one-off | **Unverified:** that the M1 runs the Xcode version App Store submission requires in 2026. The M1 supports macOS 26, so likely yes |

**Real-device testing cannot be done in the cloud cheaply.** Simulators do not reproduce microphone processing, route changes or Bluetooth behaviour. The §2.7 test needs physical iPhones in every path, web included. A used iPhone (about £156) is the one Apple purchase the CTO should budget for **regardless of stack**.

## 4. App store payment rules (decision 7)

### 4.1 Apple

- **3.1.1:** unlocking features or functionality, including subscriptions and premium content, must use in-app purchase [S1].
- **3.1.3(d) Person-to-Person Services:** "If your app enables the purchase of **real-time** person-to-person services between two individuals (for example tutoring students, medical consultations, real estate tours, or fitness training), you may use purchase methods other than in-app purchase. One-to-few and one-to-many real-time services must use in-app purchase" [S1]. The "real-time" qualifier was added in the September 2020 revision [S29].
- **Does asynchronous video coaching qualify?** The literal text says *real-time*. Submitting recordings and receiving feedback days later is not real-time. **Assumed answer: it does not qualify.**
- **3.1.3(e)** (services consumed outside the app) does not apply: the feedback is consumed in the app [S1].
- **3.1.3(a) Reader apps** covers "magazines, newspapers, books, audio, music, and video" [S1]. **Interpretation:** a coaching service is not a reader app, although the exercise library alone might be argued as "video".
- **3.1.3(b) Multiplatform:** content bought on the web may be accessed in the app "provided those items are **also available as in-app purchases** within the app" [S1].
- **3.1.3(f) Free stand-alone companion apps** to a paid web tool need no IAP if there is no purchasing and no calls to action [S1]. The examples are VoIP, cloud storage and email.
- **Evidence that login-only is not safe:** in December 2025, a login-only companion app for a web-based fitness-coaching SaaS was rejected under 3.1.1: "Your app accesses digital content purchased outside the app, and that content is not available through in-app purchase." No resolution was posted. Comparable apps (Trainerize, Everfit) are in the store [S31]. Enforcement is inconsistent.
- **US storefront:** the 2021 injunction as enforced in April 2025 bars Apple from restricting in-app buttons or links to external purchase. The Ninth Circuit affirmed contempt on 11 December 2025 but vacated the total ban on commissions. It remanded for a cost-based rate [S46][S47]. Apple has charged **zero commission** on US linked-out purchases since the contempt ruling. It has proposed 15% (standard) and 5% (small business) in the rate-setting [S48]. The Supreme Court **granted certiorari on 30 June 2026** on the contempt question [S49]. Apple's guidelines now state that the anti-steering prohibition "does not apply" in the US storefront [S1].
- **Interpretation:** the US exemption lets the app *link* to web checkout. The guideline text does not say IAP need not *also* be offered, so a US app might still be asked to add IAP under 3.1.1. **Unverified.**
- **EU:** new single terms from **1 October 2026**: IAP 26%, alternative in-app payment 20%, link-out 15%. Small Business Program and similar: 15% / 10% / 10% [S50].
- **UK:** today the non-US rule applies, so no in-app calls to action to external purchase. The CMA consulted (closed 28 July 2026) on a steering conduct requirement under the DMCCA that would permit links, with lower steering fees [S51][S52]. It is **not yet in force.**
- **Small Business Program:** 15% commission for developers with ≤ $1M proceeds in the prior year [S53].

### 4.2 Google Play

- Play Billing is required for digital subscriptions, *explicitly including "education"* and "fitness". Exemptions cover physical goods and services, peer-to-peer payments and similar. **No tutoring or coaching exemption** [S54].
- **US:** alternative billing and external-link programmes launched on 9 December 2025, with service fees and reporting deadlines on 1 October and 1 December 2026 [S55]. Secondary sources report a 20% fee on link-out purchases within 24 h, and extension to the UK and EEA from 30 June 2026 (**unverified** against Google primary docs) [S56]. The Epic–Google settlement awaited court approval as of mid-2026 [S56].
- **Interpretation:** a Trusted Web Activity (a PWA packaged for Play) is a Play app and falls under the same policy.

### 4.3 Answer assumed and confidence

**Assumed:** if a native or wrapped iOS or Android app lets users buy coaching, or merely unlocks coaching bought on the web, Apple and Google will treat it as a digital service. Such an app needs IAP or Play Billing (15% small-business rate), except where a regional link-out regime applies (US now, EU at 15%/10%, UK pending). Asynchronous coaching does **not** fit 3.1.3(d).

**Confidence: moderate-high (about 75%)** on "3.1.3(d) does not cover async" (literal text plus the S31 rejection). **Moderate (about 55%)** on how a login-only app would fare. Review is inconsistent and precedents exist both ways.

**Implication:** a **pure web app is outside both stores' payment rules entirely.** This is a concrete, monetary argument *for* web-first. It is the largest hidden cost of the native path: 15% of coaching revenue from app buyers, plus a dual price-list and entitlement sync.

## 5. CI/CD

### 5.1 Web-first pipeline (now)

- **Repo:** a GitHub monorepo (web app, database migrations, edge functions).
- **Hosting:** Cloudflare Pages/Workers or Vercel. Both give a **preview deploy per branch/PR** with a unique URL [S57]. Media goes to whichever host brief 01 selects.
- **Database:** Supabase Branching creates a preview database per PR and runs migrations on merge to main [S58] (if Supabase is chosen in brief 04).
- **Checks on every PR:** typecheck, lint, unit tests (Vitest), Playwright end-to-end on Chromium, Firefox and WebKit. Note that Playwright's WebKit is **desktop WebKit, not iOS Safari**, and has no fake-media-device flags. Recording tests therefore run only on Chromium with `--use-fake-device-for-media-stream` [S59].
- **iOS reality check:** a manual release checklist on one physical iPhone (the §2.7 script, abbreviated). Optional real-device cloud such as BrowserStack before releases (pricing **unverified**).
- **Agentic development:** agents work on branches and open PRs. The preview URL plus the preview DB is the review artefact. A human (the CTO) approves merges. Migrations and payment code need human review. CI is the gate agents cannot bypass, so branch protection is required.

### 5.2 If a Capacitor shell is added

- The same repo gains `ios/` and `android/` projects. The web build is copied into the shells.
- **Add a macOS job**, only on tags or release branches to control cost: GitHub Actions `macos` runner or Codemagic, running `npx cap sync` and fastlane (`match` for signing, `pilot` for TestFlight upload via an App Store Connect API key). Estimated cost: $1 per build.
- Web-only changes can ship through a live-update channel (for example Capgo or Appflow; pricing **unverified**) within App Review limits. Native plugin changes need a store release.
- **First-time signing setup without a Mac:** fastlane match with an API key can create certificates from CI. This is **interpretation**: feasible but fiddly. Budget one MacinCloud day (about $1/h) as insurance.

### 5.3 If a KMP / Compose iOS app is added

- Gradle builds the shared module on Linux. The iOS framework and app need the macOS runner for every iOS build [S33]. That means more macOS minutes than Capacitor, and a second UI to test.

## 6. Verdict

**Web-first is reasonable for Singology, but not unconditionally.** The CTO's framing is correct: the value is the asynchronous relationship. The web also sidesteps a probable 15% platform cut on coaching sales. The steelman lands on one thing, **controlled audio capture on iPhone during sing-along**, and that is the product's core signal (decision 4). It is currently *unverified in both directions*. Nobody should commit to either stack without the §2.7 measurement.

**Staged recommendation:**

1. **Stage 0 (before build, 1 to 2 days):** buy or borrow iPhones and run the §2.7 fidelity, routing and upload test.
2. **Stage 1 (launch): responsive web app plus PWA install prompt.**
   - In-page MediaRecorder with processing disabled, *if* Stage 0 passes. Otherwise `<input capture>` as the iOS default, with guide tracks played from a second device.
   - Chunked resumable uploads.
   - Declarative Web Push plus email.
   - Billing only on the web.
3. **Stage 2 (when any trigger fires): Capacitor shell for iOS (and Android).**
   - A native recorder plugin (`.measurement` mode, route control, USB input) and background URLSession upload.
   - **No purchasing in-app.** Accept the review risk in §4 or add IAP at the small-business rate if forced. In the US storefront, use a link-out.
   - Built on Codemagic or GitHub macOS runners, with a used iPhone for testing.
4. **Stage 3 (only if the Android KMP app is strategically primary):** reconsider a Compose Multiplatform native client. Not recommended while the web is the primary surface.

**Risks that would most change my mind:**

1. **Stage 0 fails:** iOS Safari applies unremovable AGC or band-limiting, or routes the backing track to the speaker. Then in-page recording on iOS is unfit for vocal coaching, and the Capacitor shell becomes a **launch requirement**, not stage 2.
2. **Apple narrows web apps again** (as with the 2024 EU episode), or Web Push on iOS proves unreliable in practice. Either would erode the PWA's viability on the majority platform.

## Decision triggers

Move to Stage 2 (native shell) when **any** of these is measured:

| # | Trigger | Threshold | How to measure |
|---|---|---|---|
| T1 | iOS recording fidelity | Stage 0 shows a spectral ceiling below 15 kHz, measurable AGC pumping (>6 dB gain change on a constant-level tone), or backing-track bleed on wired headphones | §2.7 test script |
| T2 | Coach-rated quality | More than 10% of iOS submissions over any 4 weeks flagged by coaches as "audio unusable/impaired" vs under 3% for non-iOS | A one-click quality flag in the coach review UI |
| T3 | Upload reliability | iOS submission upload failure or abandonment above 5%, or median resume attempts above 1, over 4 weeks | Upload telemetry (started, completed, resumed) |
| T4 | Engagement gap | iOS students' 8-week retention is 10 or more percentage points below Android/desktop, with at least 100 iOS students in the cohort | Cohort analytics by platform |
| T5 | Notification reach | Fewer than 30% of active iOS students have Web Push enabled after 60 days, *and* median time-to-view feedback for iOS is more than 1.5x that of push-enabled users | Push subscription table plus feedback-viewed timestamps |
| T6 | External mic demand | 10 or more distinct students or coaches request USB-interface recording in a quarter | Support tagging |
| T7 | Policy | Apple restricts Home Screen web apps or Web Push in the UK | Monitor the WebKit blog and Apple developer news |

Re-evaluate the **payment design** (not the stack) when the UK CMA steering requirement takes effect, or when the US rate-setting or Supreme Court decision lands.

## Interpretations to confirm

1. **3.1.3(d) excludes asynchronous coaching.** Based on the literal word "real-time" [S1]. Apple has not published guidance on asynchronous one-to-one services. Confirm with Apple (App Review pre-submission contact or appeal) before building a native app that touches purchases.
2. **A login-only app (no purchase UI) may still be rejected under 3.1.1 / 3.1.3(b).** Based on a single forum report [S31] versus comparable approved apps. Treat as a real risk, not a certainty.
3. **The US link-out rule does not remove the obligation to also offer IAP.** A reading of the guideline text, not confirmed by Apple or the court.
4. **On iOS, WebKit ties `noiseSuppression` and `autoGainControl` to `echoCancellation`** (voice-processing I/O unit vs plain I/O unit). From recollection of WebKit architecture, not a primary source retrieved today. Stage 0 settles it empirically.
5. **The native Camera app (via `<input capture>`) applies no voice-style processing but may pause other audio.** Not confirmed by Apple documentation.
6. **Xcode Cloud requires Xcode (a Mac) for the first workflow setup.** Apple's page says workflows are configured in Xcode [S40].
7. **A used M1 Mac mini is sufficient for 2026 App Store submissions.** Not checked against Apple's current minimum Xcode/SDK requirement.
8. **What the existing Android KMP app is for.** The brief assumes it is separate from Singology. If it is intended as the Singology Android client, the §3 recommendation tilts toward Compose Multiplatform, and Google Play Billing (§4.2) applies to it now.
9. **The UK and US jurisdiction assumption** follows journal decision 5.

## Sources

All accessed 2026-09-23.

- [S1] Apple App Review Guidelines (3.1.1, 3.1.1(a), 3.1.3(a)–(g)). https://developer.apple.com/app-store/review/guidelines/
- [S2] Apple App Review Guidelines 4.2 Minimum Functionality. https://developer.apple.com/app-store/review/guidelines/#minimum-functionality
- [S4] addpipe, "getUserMedia() Audio Constraints". https://blog.addpipe.com/getusermedia-audio-constraints/
- [S5] WebKit Bug 179411, "getUserMedia echoCancellation constraint has no affect". https://bugs.webkit.org/show_bug.cgi?id=179411
- [S6] WebKit, "WebKit Features in Safari 18.4". https://webkit.org/blog/16574/webkit-features-in-safari-18-4/
- [S7] WebKit, "Meet Declarative Web Push". https://webkit.org/blog/16535/meet-declarative-web-push/
- [S8] WebKit, "Web Push for Web Apps on iOS and iPadOS". https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- [S9] Apple WWDC25, "Learn more about Declarative Web Push". https://developer.apple.com/videos/play/wwdc2025/235/
- [S10] caniuse, BackgroundFetchManager fetch. https://caniuse.com/mdn-api_backgroundfetchmanager_fetch
- [S11] WebKit, "WebKit Features in Safari 26.0". https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ and heise, "iOS 26: changed web app behaviour on the home screen". https://www.heise.de/en/news/iOS-26-and-iPadOS-26-Changed-web-app-behaviour-on-the-home-screen-10749652.html
- [S12] WebKit, "Updates to Storage Policy". https://webkit.org/blog/14403/updates-to-storage-policy/
- [S13] TechCrunch, "Apple reverses decision about blocking web apps on iPhones in the EU" (1 March 2024). https://techcrunch.com/2024/03/01/apple-reverses-decision-about-blocking-web-apps-on-iphones-in-the-eu/
- [S14] Apple, Audio Session Programming Guide, "Audio Guidelines By App Type". https://developer.apple.com/library/archive/documentation/Audio/Conceptual/AudioSessionProgrammingGuide/AudioGuidelinesByAppType/AudioGuidelinesByAppType.html
- [S15] Apple Developer Forums, AVAudioSession tag (measurement mode, voice processing). https://developer.apple.com/forums/tags/avaudiosession
- [S16] "iOS Safari forces audio output to speakers when using getUserMedia" (Medium). https://medium.com/@python-javascript-php-html-css/ios-safari-forces-audio-output-to-speakers-when-using-getusermedia-2615196be6fe
- [S17] Benefic, "Why iOS caps external USB DACs at 48 kHz". https://benefic.com/blog/why-ios-caps-usb-dacs-at-48khz
- [S18] Apple, "Downloading files in the background" (URLSession background configuration). https://developer.apple.com/documentation/foundation/downloading-files-in-the-background (page body did not render; behaviour summarised from Apple forum threads https://developer.apple.com/forums/thread/675079, **partly unverified**)
- [S19] Capawesome, Capacitor File Transfer plugin. https://capawesome.io/docs/sdks/capacitor/file-transfer/
- [S20] Capgo, capacitor-uploader. https://github.com/Cap-go/capacitor-uploader
- [S21] StatCounter, Mobile OS market share UK. https://gs.statcounter.com/os-market-share/mobile/united-kingdom
- [S22] StatCounter, Mobile OS market share US. https://gs.statcounter.com/os-market-share/mobile/united-states-of-america
- [S23] Sensor Tower, "2026 State of Mobile". https://sensortower.com/blog/state-of-mobile-2026 (70.5% App Store share figure via search summary, **not read in full**)
- [S24] Fortune Business Insights, Smartphone Music Production Software Market. https://www.fortunebusinessinsights.com/smartphone-music-production-software-market-106428
- [S25] addpipe, "HTML Media Capture video quality when recording from Safari on iOS". https://blog.addpipe.com/video-quality-when-recording-videos-from-safari-on-ios-through-html-media-capture/
- [S26] Apple Developer Forums thread 658708 (input file returns original HEVC). https://developer.apple.com/forums/thread/658708
- [S28] DEV, "How we solved iOS audio analysis for breathwork biofeedback" (April 2026). https://dev.to/felix_zeller_6f3c43a7513f/how-we-solved-ios-audio-analysis-for-breathwork-biofeedback-5lo
- [S29] Hacker News discussion of the September 2020 guideline 3.1.3(d) change. https://news.ycombinator.com/item?id=24445736
- [S30] MagicBell, "PWA iOS limitations and Safari support [2026]". https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
- [S31] Apple Developer Forums thread 811018, "Rejected under Guideline 3.1.1 – B2B SaaS app, existing accounts only". https://developer.apple.com/forums/thread/811018
- [S32] Expo pricing. https://expo.dev/pricing
- [S33] Kotlin Multiplatform FAQ (macOS host needed for iOS). https://kotlinlang.org/docs/multiplatform/faq.html
- [S34] JetBrains, "Compose Multiplatform 1.8.0 released: Compose Multiplatform for iOS is stable". https://blog.jetbrains.com/kotlin/2025/05/compose-multiplatform-1-8-0-released-compose-multiplatform-for-ios-is-stable-and-production-ready/
- [S35] JetBrains, "Compose Multiplatform 1.11.0 is now available". https://blog.jetbrains.com/kotlin/2026/05/compose-multiplatform-1-11-0/
- [S36] Apple Developer Program enrolment. https://developer.apple.com/programs/enroll/
- [S37] Apple, Developer Program fee waivers. https://developer.apple.com/help/account/membership/fee-waivers/
- [S38] GitHub, "Pricing changes for GitHub Actions" (2026). https://github.com/resources/insights/2026-pricing-changes-for-github-actions
- [S39] Codemagic pricing. https://codemagic.io/pricing/
- [S40] Apple, Xcode Cloud. https://developer.apple.com/xcode-cloud/
- [S41] MacinCloud Pay-as-you-go. https://www.macincloud.com/pages/payg.html (prices via search summary, **unverified**)
- [S42] AWS, Amazon EC2 Mac instances user guide. https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-mac-instances.html
- [S43] Vantage, mac2.metal pricing. https://instances.vantage.sh/aws/ec2/mac2.metal
- [S44] Tech Trade, refurbished Mac mini. https://tech.trade/refurbished-mac-mini
- [S45] Back Market UK, refurbished iPhone 12. https://www.backmarket.co.uk/en-gb/p/iphone-12
- [S46] Epic Games v. Apple, No. 25-2935 (9th Cir. 11 December 2025). https://cdn.ca9.uscourts.gov/datastore/opinions/2025/12/11/25-2935.pdf
- [S47] Cravath, "Epic Games' Ninth Circuit win affirming civil contempt finding". https://www.cravath.com/news-insights/epic-games-ninth-circuit-win-affirming-civil-contempt-finding.html
- [S48] MacDailyNews, "U.S. Supreme Court clears path for App Store commission showdown" (14 August 2026). https://macdailynews.com/2026/08/14/u-s-supreme-court-clears-path-for-app-store-commission-showdown-as-apple-must-defend-its-rates-in-lower-court/
- [S49] IPWatchdog, "High Court grants cert in Apple's challenge to Ninth Circuit contempt ruling" (30 June 2026). https://ipwatchdog.com/2026/06/30/high-court-grants-cert-in-apples-challenge-to-ninth-circuit-contempt-ruling-in-app-store-dispute/
- [S50] Apple Newsroom, "Apple announces changes for apps in the European Union" (August 2026). https://www.apple.com/newsroom/2026/08/apple-announces-changes-for-apps-in-the-european-union/
- [S51] GOV.UK, "CMA consults on new requirements for Apple and Google's mobile platforms". https://www.gov.uk/government/news/cma-consults-on-new-requirements-for-apple-and-googles-mobile-platforms
- [S52] MacRumors, "Apple says UK App Store steering rules would be 'highly intrusive'" (29 July 2026). https://www.macrumors.com/2026/07/29/app-store-uk-rules-highly-intrusive/
- [S53] Apple, App Store Small Business Program. https://developer.apple.com/app-store/small-business-program/
- [S54] Google Play Console Help, Payments policy. https://support.google.com/googleplay/android-developer/answer/9858738?hl=en
- [S55] Google Play Console Help, "An update regarding Google Play's policies for developers serving users in the US". https://support.google.com/googleplay/android-developer/answer/15582165?hl=en
- [S56] Stash, "Epic v. Google settlement update April 2026" (secondary). https://www.stash.gg/blog/blog-epic-v-google-settlement-update-april-2026
- [S57] Cloudflare Pages, Preview deployments. https://developers.cloudflare.com/pages/configuration/preview-deployments/
- [S58] Supabase Docs, Branching. https://supabase.com/docs/guides/deployment/branching
- [S59] Playwright issue #5444 (no fake media on WebKit/Firefox). https://github.com/microsoft/playwright/issues/5444
