---
title: "Research brief 01: Video hosting"
type: research
status: draft
---

# Research brief 01: Video hosting

Answers vision Q1 in [gtm-vision.md](../gtm-vision.md). It uses the cost-model assumptions in decision 3 and the audio-fidelity requirement in decision 4 of [gtm-journal-01.md](../gtm-journal-01.md). All prices are in USD, exclude VAT, and were accessed on 2026-09-23 unless marked otherwise.

## Summary

- **YouTube: not permitted, and not viable.** The API Developer Policies say API clients "must not charge users to watch content in an embedded YouTube player". They also forbid modifying the player, blocking ads or obscuring branding. Unlisted videos are public to anyone who has the link. Private videos cannot be embedded. Uploads fall under Content ID and could bring strikes against whichever channel holds them. Do not use it.
- **Vimeo: fits only a pilot.** Every self-serve plan has a 2 TB/month bandwidth threshold. At 1,000 students, delivery is 5 to 21 TB/month at 480p to 1080p, which forces the unpriced Enterprise plan. Bending Spoons bought Vimeo in November 2025, and staff cuts followed. That adds vendor risk.
- **Purpose-built hosts: Bunny Stream is the best fit.** Bunny bills per GB and does not charge for encoding. It supports tus uploads, token authentication, webhooks and keeping the original files. Cloudflare Stream and Mux are excellent products, but they bill storage per minute. Keeping student uploads for 12 months then costs 10 to 20 times more than on Bunny.
- **DIY on R2 is the cheapest option.** R2 charges nothing for egress, but the CTO must build and own transcoding and access control. Supabase Storage is workable, but its egress is 9 times the price of Bunny's.
- **Vercel should host the frontend only.** Its Flat Rate CDN excludes media-heavy bandwidth.
- **Audio.** Every managed host re-encodes audio, and none publishes its audio bitrate. Test each one before committing. Minimum: AAC-LC at 160 kbps stereo (or 128 kbps mono), 48 kHz, and keep the original upload.
- **Recommendation.** Primary pick: **Bunny Stream**. Fallback: **R2 DIY**. At 1,000 students and 720p, Bunny costs **\$6,331/yr** with 12-month retention, or **\$2,534/yr** with 90-day retention.

## 1. YouTube

**What the terms say.**

- **Charging for access.** "API Clients must not charge users to watch content in an embedded YouTube player" (Developer Policies III.F.3.a). Selling access to any component of YouTube API Services needs YouTube's prior written approval (III.G.1.b). Selling an API client is allowed (III.G.2.a). Our paid subscription would gate access to embedded library videos and student videos. On a plain reading, that is charging users to watch content in an embedded player. [S1]
- **Player and branding.** Clients must not "modify, build upon, or block any portion or functionality of a YouTube player" (III.I.6). They must not "modify, interfere with, replace, or block advertisements placed or served by YouTube" (III.I.5). They must not obscure YouTube attribution (III.F.2.3). [S1] The `modestbranding` parameter is deprecated: since August 2023 the player decides its own branding. Related videos cannot be switched off. `rel=0` only limits them to the same channel. The minimum player viewport is 200×200 px. [S2] We could not own the look of the player.
- **Ads.** The YouTube Terms give YouTube "the right to monetize your Content on the Service (and such monetization may include displaying ads on or within Content or charging users a fee for access)" (Terms effective 17 March 2025). [S3] A Content ID claim can monetise a video by running ads on it. [S4]
- **Content ID on covers.** "When a video is uploaded to YouTube, it's automatically scanned by Content ID." The page gives no exception for private or unlisted videos. The possible outcomes are block, monetise with ads, or track, and they can differ by country. [S4] Students singing chart songs will be matched against the original recordings and the publishers' compositions. Some submissions would be blocked or muted, and some would carry the rights holder's ads. See Interpretations to confirm, I-13.
- **Whose channel receives uploads.**
  - *Our channel.* Every student cover would sit on one channel. The Terms provide for "the termination... of repeat infringers' access". [S3] Copyright strikes against that one channel would put the whole media backend at risk.
  - *Each student's own channel.* Every student would need a Google account and a YouTube channel, plus an OAuth grant. The client must identify the channel on each request (III.E.3.e). The user must keep final control of what is published (III.C.3). [S1] YouTube requires users to be at least 13, which clashes with the safeguarding scope in decision 6. That age limit comes from YouTube's age requirements and is **unverified** here.
- **Access control.**
  - Unlisted videos "can be seen and shared by anyone with the link", and no Google account is needed to watch them. Private videos "cannot be shared via URL or embedded". [S5]
  - An unlisted embed therefore leaks its video ID into our page's HTML and the iframe `src`. Anyone who has the ID can watch the video on youtube.com, reshare it, or run it through download tools. The link never expires, and it cannot be revoked without deleting the video. Signing the URL is not possible.
- **API quota and audit.** `videos.insert` now costs 1 unit in a separate "Video Uploads" bucket, limited to **100 calls per day** per project. Videos uploaded from unverified API projects created after 28 July 2020 "will be restricted to private viewing mode" until the project passes an audit. Private videos cannot be embedded. [S6] At 1,000 students, each uploading one submission per week, plus coach feedback videos, uploads come to roughly 285 a day, well over the limit. Raising it needs a quota extension through the compliance audit (III.D.3). [S1]
- **Other restrictions.** Clients must not cache or store copies of the audiovisual content (III.E.1.a). They must not separate or isolate the audio or video track (III.I.7). They must not offer offline playback (III.E.1.b). [S1]

**Verdict: no.** YouTube is free in cash, but its terms prohibit the core of this product: paid, authenticated, branded playback. Its privacy model cannot enforce our authentication. It also routes student covers into Content ID.

## 2. Vimeo

**Plans (UK pricing page, shown including 20% VAT).** [S7]

| Plan | Billed annually | Billed monthly | Users | Storage | Relevant features |
|---|---|---|---|---|---|
| Starter | £10.80/mo (£9.00 ex VAT) | £15 | 1 | 2 TB | Customisable player, password privacy, unlisted links |
| Standard | £22.80/mo (£19.00 ex VAT) | £31 | 5 | 4 TB | Adds your own branding in the player, third-party player support, custom watermark |
| Advanced | £82.80/mo (£69.00 ex VAT) | £115 | 10 | 7 TB | Adds livestreaming and events |
| Enterprise | Contact sales | | More | "More storage and bandwidth" | SSO, custom permissions |

- **USD prices** of $12, $25 and $75 per month billed annually come from third-party summaries only. They are **unverified**. [S8]
- **Bandwidth.** "The bandwidth threshold is 2TB (measured as 2,000GB) per month." It applies to all self-serve plans, and upgrading does not raise it. Vimeo does not stop playback when the threshold is passed. It may contact the account after it exceeds 2 TB twice in 12 months, or 10 TB once. The account must then reach a resolution within seven days or "is at risk of being temporarily suspended". [S9]
- **Privacy and embedding.** Paid plans include unlisted links, passwords, "Hide from Vimeo" and domain-level embed privacy, which limits the websites that can embed a video. [S10] [S11] These controls work by domain, not by user. A logged-out visitor to an allowed domain can still play the video unless our frontend gates the page. Vimeo has no per-viewer signed token comparable to Cloudflare, Mux or Bunny. This is our reading of the privacy options; see I-12.
- **API upload.** The Vimeo API supports resumable tus uploads and recommends them "for just about everyone". [S12]
- **Ownership and 2026 changes.** Bending Spoons completed its $1.38B acquisition of Vimeo in November 2025. Reports say layoffs in January 2026 affected more than 1,000 employees, including the whole video engineering team. These reports are press sources, not primary sources, and are **unverified**. [S13] [S14] We found no primary-source announcement of price or plan changes since the acquisition. Bending Spoons made cuts after buying Evernote. Price increases are a documented risk, not an announced fact. [S13]

**Verdict: pilot only.** At 100 students, 480p or 720p fits the Standard or Advanced plan for $300 to $900 a year. At 1,000 students, delivery at video tiers runs 5 to 21 TB/month, far over the 2 TB threshold, so Enterprise at an unpublished price becomes mandatory. Access control works by domain, not by user, and ownership is unsettled. Do not build on Vimeo.

## 3. Purpose-built video infrastructure

### Cloudflare Stream

- **Pricing.** Storage is "$5 per month for each 1,000 minutes of video storage capacity", prepaid. Delivery is "$1 per 1,000 minutes delivered". "Ingress... and encoding are always free." Bandwidth is included in the delivery charge. Price depends only on duration, not resolution. [S15]
- **Access.** Signed URL tokens can be generated locally from a signing key, with no API call and no rate limit. Tokens expire within at most 24 hours. Stream also supports IP and country access rules and an allowed-origins list. [S16]
- **Uploads and webhooks.** Direct creator uploads use a one-time URL. Files over 200 MB must use tus, which is resumable. Each upload must reserve a maximum duration against storage. Webhooks report status. [S17]
- **Limits.** Maximum upload is 30 GB. The adaptive ladder is 360p to 1080p, so output is capped at 1080p. The resolution cap comes from a third-party summary and is **unverified**. [S18] [S19]
- **Downsides.** Storage is billed per minute, so long retention of student uploads is expensive. See the cost tables.

### Mux

- **Encoding.** Free at Basic quality. Plus quality costs $0.025/min up to 720p and $0.03125/min at 1080p. [S20]
- **Storage per minute per month** (Basic/Plus): $0.0024 up to 720p, $0.0030 at 1080p, $0.00024 for audio-only. [S20]
- **Delivery per minute:** $0.0008 up to 720p, $0.0010 at 1080p, $0.00008 for audio-only. The first 100,000 minutes each month are free. [S20]
- **Tiers.** Audio-only is billed at "1/10th the cost of 720p basic video". Volume discounts apply above 50,000 stored minutes and 500,000 delivered minutes, but they are not itemised. [S20] Mux has no 480p price point, so 480p bills at the "up to 720p" rate.
- **Access.** Signed playback uses JWTs signed locally with an RSA key. Playback restrictions can limit referrer domains and user agents. [S21]
- **Uploads and webhooks.** Direct uploads go to a resumable URL through the UpChunk library, which splits files into chunks. This is not tus. Webhooks include `video.asset.ready`. [S22]
- **Plans.** Pay as you go comes with a $20 monthly credit. [S23]
- **Strength.** Mux has the best developer experience and the most granular pricing of the managed hosts.

### Bunny Stream

- **Pricing.** Encoding is free. Storage is "from $0.01/GB". Delivery is "from $0.005/GB". The monthly minimum is $1. [S24]
- **CDN delivery.** The Standard network charges $0.01/GB in Europe and North America, $0.03/GB in Asia and Oceania, and $0.045 to $0.06/GB elsewhere. The Volume network charges $0.005/GB for the first 500 TB. [S25]
- **Storage replication.** HDD storage costs $0.01/GB per region for up to two regions, then $0.005/GB for each extra region. [S26]
- **Optional paid encoding.** Premium encoding costs $0.025/min for SD and $0.05/min for 720p or 1080p. The free encoder is "a shared service intended for low volume workloads" and can be delayed at peak times. [S27] [S28]
- **Access.** Embed tokens are `SHA256(token_key + video_id + expiry)`. [S29] CDN token authentication V2 has a `token_path` option: signing one HLS playlist URL authorises every segment in its directory. [S30]
- **Uploads.** Resumable tus uploads are authorised by a server-side SHA-256 signature. [S31]
- **Webhooks.** HMAC-signed status webhooks. [S32]
- **Originals and storage size.** "Keep original files" stores the upload alongside the encoded versions. Every enabled resolution and every MP4 fallback adds to billed storage. MP4 fallback goes up to 1080p. [S28] [S33]
- **Strength.** Per-GB billing at CDN prices, with no minute-based storage charge.

### api.video

- **Pricing.** Encoding is free. Hosting is "from $0.00285 per minute stored". Delivery is "from $0.0017 per minute delivered". Custom domains cost from €60/month. [S34]
- **Ownership.** Crunchbase reports that OVHcloud acquired api.video in February 2025. **Unverified.** [S35]
- **Verdict.** It is priced per minute like Cloudflare and Mux but costs more than either, so it leads on nothing here. It appears in the cost tables for completeness.

### 2026 entrants

We found no new entrant with primary-source pricing that beats Bunny for this workload. Newer video APIs such as FastPix and Gumlet appear in third-party comparisons. We did not evaluate them and give no prices.

### DIY: object storage plus our own player

- **Cloudflare R2.**
  - Pricing: storage $0.015/GB-month. Class A writes cost $4.50 per million. Class B reads cost $0.36 per million. Egress is free. The free tier covers 10 GB, 1M Class A and 10M Class B operations each month. [S36]
  - Presigned URLs support GET, HEAD, PUT and DELETE, and last up to 7 days. They do **not** work on custom domains, only on the `r2.cloudflarestorage.com` endpoint. [S37] Authorising HLS segments on our own domain therefore needs a Worker. Workers Paid costs $5/month and includes 10M requests, then $0.30 per million. [S38]
  - Cloudflare's CDN terms restrict serving video through the CDN without the relevant paid services. The Developer Platform, which includes R2, is one of the permitted routes. [S39]
- **Supabase Storage (Pro plan).**
  - Pricing: $25/month. Includes 100 GB storage, 250 GB egress and 250 GB cached egress. Overage: storage $0.0213/GB, egress $0.09/GB, cached egress $0.03/GB. Maximum upload is 500 GB. [S40]
  - Uploads use tus, which is resumable, with a fixed 6 MB chunk size. [S41]
  - `createSignedUrl` issues time-limited URLs, signed with a key separate from the Auth JWT key. [S42]
  - Advantage: bucket policies can share one identity model with the core database.
- **Backblaze B2 and S3.** Not costed. S3 egress would dominate the bill. B2 is similar to R2 but needs a CDN partner for free egress. Both are **unverified**; we fetched no primary pricing for either.
- **Transcoding.** Without a transcode step, students' phone files are served as they are. iPhone files are often HEVC in MOV at high bitrates, and playback and bandwidth become unpredictable. There are two ways to avoid a server pipeline:
  - Record in the browser with MediaRecorder at a set bitrate, which avoids server transcoding for in-app recordings.
  - Run ffmpeg on a small worker for camera-roll uploads.

  Either way, the CTO owns this code. We did not cost the compute for server-side ffmpeg; it is **unverified**, and we estimate it as small against storage. See I-11.

### Vercel

Vercel is **not a sensible video host**. Use it as the frontend host only.

- **Flat Rate CDN.** The Pro plan includes 1 TB of transfer. Paid tiers cost $20 to $300/month for 50 TB. [S43] Flat Rate CDN is "not eligible for... large-scale delivery of media or files where such delivery constitutes a majority of bandwidth usage". Vercel may move such projects to a best-effort tier or require a different product. [S43]
- **On-demand pricing.** Fast Data Transfer costs $0.15 to $0.35/GB. Blob Data Transfer costs $0.05 to $0.117/GB. Blob storage costs $0.023 to $0.041/GB. [S44] Serving private blobs through a Function adds Fast Data Transfer and Fast Origin Transfer charges on top. [S45]
- **Example.** At 1,000 students and 720p, delivery is about 10,547 GB/month. Blob transfer alone would cost about $527/month at the cheapest rate, and about $1,582/month through Functions at $0.15/GB.

## 4. Ratings

Ratings run from ★ (poor) to ★★★★★ (excellent). Cost is rated at 1,000 students, 720p, 12-month retention.

| Candidate | (a) Access flexibility | (b) Bootstrapping (higher means less to build) | (c) Cost | Notes |
|---|---|---|---|---|
| YouTube | ★ | ★★★ | ★★★★★ (free) | Prohibited by the terms. Unlisted is public to anyone with the link. The player cannot be modified. |
| Vimeo | ★★ | ★★★★ | ★ at scale | Domain-level privacy only. Has tus. Forces Enterprise above about 2 TB/month. |
| Cloudflare Stream | ★★★★★ | ★★★★★ | ★ | Signed tokens, tus, webhooks, any player. Per-minute storage is punishing with retention. |
| Mux | ★★★★★ | ★★★★★ | ★★ | Best developer experience. Signed JWTs, resumable uploads (not tus), webhooks. |
| Bunny Stream | ★★★★ | ★★★★ | ★★★★★ | Token auth (embed and directory-level HLS), tus, webhooks, originals kept. Free encoder is best-effort. |
| api.video | ★★★★ | ★★★★ | ★★ | Per-minute pricing, more expensive than Mux. |
| R2 DIY | ★★★★★ | ★★ | ★★★★★ | Full control. We must build transcoding, the Worker that authorises segments, and resumable multipart uploads. |
| Supabase Storage DIY | ★★★★ | ★★★ | ★★★ | Same identity as the database, tus, signed URLs. We must build transcoding. Egress at $0.09/GB. |
| Vercel Blob | ★★★ | ★★★ | ★★ | Excluded from Flat Rate CDN for media-majority traffic. |

## 5. Cost model

### Derived quantities (decision 3)

GB per hour = Mbps × 3,600 ÷ 8 ÷ 1,000 = **Mbps × 0.45**.

| Tier | Total bitrate | GB/hour |
|---|---|---|
| Audio-only | 128 kbps | 0.0576 |
| 480p | 1.2 Mbps | 0.54 |
| 720p | 2.5 Mbps | 1.125 |
| 1080p | 5 Mbps | 2.25 |

Per student per year:

- **Ingested** = 25 h of submissions + 12.5 h of feedback videos (0.25 h × 50 weeks) = **37.5 h**.
- **Delivered** = 25 h × 2 (submissions watched twice) + 12.5 h × 1 (feedback) + 50 h (library, 1 h × 50 weeks) = **112.5 h**.
- Per month (÷ 12): ingested 3.125 h, delivered 9.375 h (562.5 min).
- Delivered hours split into submissions plus feedback, 5.2083 h/month, and library, 4.1667 h/month. Supabase prices the two parts differently.

Hours stored at steady state:

- **12-month retention** = 37.5 h × N + 20 h library.
- **90-day retention** = 9.375 h × N + 20 h library, where 9.375 h is three months of ingest.

| Cohort N | Stored h (12 mo) | Stored min (12 mo) | Stored h (90 d) | Stored min (90 d) | Delivered h/mo | Delivered min/mo |
|---|---|---|---|---|---|---|
| 100 | 3,770 | 226,200 | 957.5 | 57,450 | 937.5 | 56,250 |
| 1,000 | 37,520 | 2,251,200 | 9,395 | 563,700 | 9,375 | 562,500 |
| 10,000 | 375,020 | 22,501,200 | 93,770 | 5,626,200 | 93,750 | 5,625,000 |

GB per month = hours × GB/h. Storage is billed per month; delivery is per month.

| N | Tier | Stored GB (12 mo) | Stored GB (90 d) | Delivered GB/mo |
|---|---|---|---|---|
| 100 | Audio | 217.15 | 55.15 | 54.00 |
| 100 | 480p | 2,035.80 | 517.05 | 506.25 |
| 100 | 720p | 4,241.25 | 1,077.19 | 1,054.69 |
| 100 | 1080p | 8,482.50 | 2,154.38 | 2,109.38 |
| 1,000 | Audio | 2,161.15 | 541.15 | 540.00 |
| 1,000 | 480p | 20,260.80 | 5,073.30 | 5,062.50 |
| 1,000 | 720p | 42,210.00 | 10,569.38 | 10,546.88 |
| 1,000 | 1080p | 84,420.00 | 21,138.75 | 21,093.75 |
| 10,000 | Audio | 21,601.15 | 5,401.15 | 5,400.00 |
| 10,000 | 480p | 202,510.80 | 50,635.80 | 50,625.00 |
| 10,000 | 720p | 421,897.50 | 105,491.25 | 105,468.75 |
| 10,000 | 1080p | 843,795.00 | 210,982.50 | 210,937.50 |

### Where the quality-tier axis collapses

- **Cloudflare Stream** and **api.video** bill per minute whatever the resolution, so all four tiers cost the same. Stream also caps output at 1080p (**unverified**).
- **Mux** bills per minute in resolution bands. 480p and 720p share the "up to 720p" band. Audio-only costs 1/10 of 720p.
- **Vimeo** is a flat plan fee until the storage or bandwidth limits are reached. The tier only decides which limit is hit first.
- **Bunny, R2 and Supabase** bill per GB, so the tier drives cost in proportion.

## Cost tables

The tables below give the monthly total, then the annual total (monthly × 12), both at steady state. The arithmetic is shown for 1,000 students; other cohorts use the same formulas.

### Cloudflare Stream (all tiers identical)

Formula: storage = ⌈stored min ÷ 1,000⌉ × $5. Delivery = delivered min ÷ 1,000 × $1. Encoding = $0.

| N | Storage 12 mo | Storage 90 d | Delivery | **Total 12 mo** (mo / yr) | **Total 90 d** (mo / yr) |
|---|---|---|---|---|---|
| 100 | 227 × $5 = $1,135.00 | 58 × $5 = $290.00 | 56.25 × $1 = $56.25 | $1,191.25 / $14,295.00 | $346.25 / $4,155.00 |
| 1,000 | 2,252 × $5 = $11,260.00 | 564 × $5 = $2,820.00 | 562.5 × $1 = $562.50 | $11,822.50 / $141,870.00 | $3,382.50 / $40,590.00 |
| 10,000 | 22,502 × $5 = $112,510.00 | 5,627 × $5 = $28,135.00 | 5,625 × $1 = $5,625.00 | $118,135.00 / $1,417,620.00 | $33,760.00 / $405,120.00 |

### Mux (Basic quality, list prices, encoding $0)

Formulas:

- Storage = stored min × rate.
- Delivery = max(0, delivered min − 100,000) × rate.
- Rates for storage / delivery: ≤720p $0.0024 / $0.0008; 1080p $0.0030 / $0.0010; audio $0.00024 / $0.00008.
- Billable delivery minutes after the free allowance: 100 students 0; 1,000 students 462,500; 10,000 students 5,525,000.

Worked example, 1,000 students at ≤720p:

- Storage (12 mo) = 2,251,200 × $0.0024 = $5,402.88.
- Storage (90 d) = 563,700 × $0.0024 = $1,352.88.
- Delivery = 462,500 × $0.0008 = $370.00.
- Totals = $5,772.88 (12 mo) and $1,722.88 (90 d).

| N | Tier | Storage 12 mo | Storage 90 d | Delivery | **Total 12 mo** (mo / yr) | **Total 90 d** (mo / yr) |
|---|---|---|---|---|---|---|
| 100 | Audio | $54.29 | $13.79 | $0 | $54.29 / $651.46 | $13.79 / $165.46 |
| 100 | 480p = 720p | $542.88 | $137.88 | $0 | $542.88 / $6,514.56 | $137.88 / $1,654.56 |
| 100 | 1080p | $678.60 | $172.35 | $0 | $678.60 / $8,143.20 | $172.35 / $2,068.20 |
| 1,000 | Audio | $540.29 | $135.29 | $37.00 | $577.29 / $6,927.46 | $172.29 / $2,067.46 |
| 1,000 | 480p = 720p | $5,402.88 | $1,352.88 | $370.00 | $5,772.88 / $69,274.56 | $1,722.88 / $20,674.56 |
| 1,000 | 1080p | $6,753.60 | $1,691.10 | $462.50 | $7,216.10 / $86,593.20 | $2,153.60 / $25,843.20 |
| 10,000 | Audio | $5,400.29 | $1,350.29 | $442.00 | $5,842.29 / $70,107.46 | $1,792.29 / $21,507.46 |
| 10,000 | 480p = 720p | $54,002.88 | $13,502.88 | $4,420.00 | $58,422.88 / $701,074.56 | $17,922.88 / $215,074.56 |
| 10,000 | 1080p | $67,503.60 | $16,878.60 | $5,525.00 | $73,028.60 / $876,343.20 | $22,403.60 / $268,843.20 |

These are list prices. Mux publishes volume discounts but does not itemise them, and the $20 monthly credit is not subtracted.

### Bunny Stream (encoding $0)

Formula: (stored GB + delivered GB) × $0.01. This uses single-region storage and the Standard network rate for Europe and North America.

Worked example, 1,000 students at 720p:

- 12-month retention: 42,210 × $0.01 + 10,546.88 × $0.01 = $422.10 + $105.47 = $527.57/month.
- 90-day retention: $105.69 + $105.47 = $211.16/month.

| N | Tier | Storage 12 mo | Storage 90 d | Delivery | **Total 12 mo** (mo / yr) | **Total 90 d** (mo / yr) |
|---|---|---|---|---|---|---|
| 100 | Audio | $2.17 | $0.55 | $0.54 | $2.71 / $32.52 | $1.09 / $13.08 |
| 100 | 480p | $20.36 | $5.17 | $5.06 | $25.42 / $305.04 | $10.23 / $122.76 |
| 100 | 720p | $42.41 | $10.77 | $10.55 | $52.96 / $635.52 | $21.32 / $255.84 |
| 100 | 1080p | $84.83 | $21.54 | $21.09 | $105.92 / $1,271.04 | $42.64 / $511.68 |
| 1,000 | Audio | $21.61 | $5.41 | $5.40 | $27.01 / $324.12 | $10.81 / $129.72 |
| 1,000 | 480p | $202.61 | $50.73 | $50.63 | $253.23 / $3,038.76 | $101.36 / $1,216.32 |
| 1,000 | 720p | $422.10 | $105.69 | $105.47 | **$527.57 / $6,330.84** | **$211.16 / $2,533.92** |
| 1,000 | 1080p | $844.20 | $211.39 | $210.94 | $1,055.14 / $12,661.68 | $422.33 / $5,067.96 |
| 10,000 | Audio | $216.01 | $54.01 | $54.00 | $270.01 / $3,240.12 | $108.01 / $1,296.12 |
| 10,000 | 480p | $2,025.11 | $506.36 | $506.25 | $2,531.36 / $30,376.32 | $1,012.61 / $12,151.32 |
| 10,000 | 720p | $4,218.98 | $1,054.91 | $1,054.69 | $5,273.66 / $63,283.92 | $2,109.60 / $25,315.20 |
| 10,000 | 1080p | $8,437.95 | $2,109.83 | $2,109.38 | $10,547.33 / $126,567.96 | $4,219.20 / $50,630.40 |

**Sensitivity.** Several choices raise the storage line:

- A 3-rung adaptive ladder instead of a single rendition.
- Keeping the originals.
- Replicating to a second region, which doubles the per-GB storage price.

Together these could make the storage line 2 to 3 times larger. At 1,000 students, 720p and 12-month retention, the total would still be about $1,000 to $1,400 a month. That is still far below Cloudflare Stream or Mux.

### Vimeo (best-fit self-serve plan)

The table gives the fit test and the resulting plan. USD prices are **unverified**: $25/month for Standard and $75/month for Advanced, billed annually. The primary-source GBP prices are £19.00 and £69.00 ex VAT.

| N | Tier | Delivered TB/mo | Stored TB (12 mo / 90 d) | Plan (12 mo) | Plan (90 d) | Annual cost |
|---|---|---|---|---|---|---|
| 100 | Audio | 0.05 | 0.22 / 0.06 | Standard | Standard | $300 / $300. Audio-only uploads may need a still-image video (**unverified**). |
| 100 | 480p | 0.51 | 2.04 / 0.52 | Standard (4 TB) | Standard | $300 / $300 |
| 100 | 720p | 1.05 | 4.24 / 1.08 | Advanced (7 TB) | Standard | $900 / $300 |
| 100 | 1080p | 2.11 (over 2 TB) | 8.48 / 2.15 | Enterprise | Enterprise | Unpublished |
| 1,000 | Audio | 0.54 | 2.16 / 0.54 | Standard | Standard | $300 / $300 |
| 1,000 | 480p to 1080p | 5.06 to 21.09 | 20.3 to 84.4 | Enterprise | Enterprise | Unpublished |
| 10,000 | All | 5.40 to 210.94 | 21.6 to 843.8 | Enterprise | Enterprise | Unpublished |

### R2 DIY

Formula: total = storage + operations + $5 for Workers Paid. Storage = stored GB × $0.015. Egress = $0.

Operations are estimated as follows:

- Reads: 600 Class B reads per delivered hour (HLS segments of 6 s).
- Writes: 100 Class A writes per ingested hour (multipart parts).
- Worker requests equal the read requests.

Only the 10,000-student cohort exceeds the free allowances:

- Class B: (56.25M − 10M) × $0.36/M = $16.65.
- Class A: (3.125M − 1M) × $4.50/M = $9.56.
- Worker requests: (56.25M − 10M) × $0.30/M = $13.88.
- Operations total: **$40.09**.

Transcoding is excluded. It is $0 if we encode in the browser (I-11).

Worked example, 1,000 students at 720p: 42,210 × $0.015 + $0 + $5 = $638.15/month.

| N | Tier | Storage 12 mo | Storage 90 d | Ops + fixed | **Total 12 mo** (mo / yr) | **Total 90 d** (mo / yr) |
|---|---|---|---|---|---|---|
| 100 | Audio | $3.26 | $0.83 | $5.00 | $8.26 / $99.12 | $5.83 / $69.96 |
| 100 | 480p | $30.54 | $7.76 | $5.00 | $35.54 / $426.48 | $12.76 / $153.12 |
| 100 | 720p | $63.62 | $16.16 | $5.00 | $68.62 / $823.44 | $21.16 / $253.92 |
| 100 | 1080p | $127.24 | $32.32 | $5.00 | $132.24 / $1,586.88 | $37.32 / $447.84 |
| 1,000 | Audio | $32.42 | $8.12 | $5.00 | $37.42 / $449.04 | $13.12 / $157.44 |
| 1,000 | 480p | $303.91 | $76.10 | $5.00 | $308.91 / $3,706.92 | $81.10 / $973.20 |
| 1,000 | 720p | $633.15 | $158.54 | $5.00 | $638.15 / $7,657.80 | $163.54 / $1,962.48 |
| 1,000 | 1080p | $1,266.30 | $317.08 | $5.00 | $1,271.30 / $15,255.60 | $322.08 / $3,864.96 |
| 10,000 | Audio | $324.02 | $81.02 | $45.09 | $369.11 / $4,429.32 | $126.11 / $1,513.32 |
| 10,000 | 480p | $3,037.66 | $759.54 | $45.09 | $3,082.75 / $36,993.00 | $804.63 / $9,655.56 |
| 10,000 | 720p | $6,328.46 | $1,582.37 | $45.09 | $6,373.55 / $76,482.60 | $1,627.46 / $19,529.52 |
| 10,000 | 1080p | $12,656.93 | $3,164.74 | $45.09 | $12,702.02 / $152,424.24 | $3,209.83 / $38,517.96 |

R2 costs slightly more than Bunny on storage ($0.015/GB against $0.01/GB) but nothing on egress. At a single rendition, the two land within about 20% of each other. R2 wins once the stored ladder and originals grow, and Bunny wins on build effort.

### Supabase Storage DIY (Pro plan)

Formula:

- Base fee: $25.
- Storage: (stored GB − 100) × $0.0213.
- Uncached egress: (submission and feedback GB − 250) × $0.09.
- Cached egress: (library GB − 250) × $0.03.
- Monthly GB: submissions and feedback = 5.2083 h × N × GB/h; library = 4.1667 h × N × GB/h.

Worked example, 1,000 students at 720p:

- Storage (12 mo) = (42,210 − 100) × $0.0213 = $896.94.
- Uncached egress = (5,859.38 − 250) × $0.09 = $504.84.
- Cached egress = (4,687.50 − 250) × $0.03 = $133.13.
- Total (12 mo) = $25 + $896.94 + $504.84 + $133.13 = $1,559.91/month.

| N | Tier | Storage 12 mo | Storage 90 d | Egress (uncached + cached) | **Total 12 mo** (mo / yr) | **Total 90 d** (mo / yr) |
|---|---|---|---|---|---|---|
| 100 | Audio | $2.50 | $0 | $0 | $27.50 / $330.00 | $25.00 / $300.00 |
| 100 | 480p | $41.23 | $8.88 | $2.81 + $0 | $69.04 / $828.48 | $36.69 / $440.28 |
| 100 | 720p | $88.21 | $20.81 | $30.23 + $6.56 | $150.00 / $1,800.00 | $82.60 / $991.20 |
| 100 | 1080p | $178.55 | $43.76 | $82.97 + $20.63 | $307.15 / $3,685.80 | $172.36 / $2,068.32 |
| 1,000 | Audio | $43.90 | $9.40 | $4.50 + $0 | $73.40 / $880.80 | $38.90 / $466.80 |
| 1,000 | 480p | $429.42 | $105.93 | $230.63 + $60.00 | $745.05 / $8,940.60 | $421.56 / $5,058.72 |
| 1,000 | 720p | $896.94 | $223.00 | $504.84 + $133.13 | $1,559.91 / $18,718.92 | $885.97 / $10,631.64 |
| 1,000 | 1080p | $1,796.02 | $448.13 | $1,032.19 + $273.75 | $3,126.96 / $37,523.52 | $1,779.07 / $21,348.84 |
| 10,000 | Audio | $457.97 | $112.91 | $247.50 + $64.50 | $794.97 / $9,539.64 | $449.91 / $5,398.92 |
| 10,000 | 480p | $4,311.35 | $1,076.41 | $2,508.75 + $667.50 | $7,512.60 / $90,151.20 | $4,277.66 / $51,331.92 |
| 10,000 | 720p | $8,984.29 | $2,244.83 | $5,250.94 + $1,398.75 | $15,658.98 / $187,907.76 | $8,919.52 / $107,034.24 |
| 10,000 | 1080p | $17,970.70 | $4,491.80 | $10,524.38 + $2,805.00 | $31,325.08 / $375,900.96 | $17,846.18 / $214,154.16 |

### api.video (all tiers identical, encoding $0)

Formula: storage = stored min × $0.00285. Delivery = delivered min × $0.0017.

| N | Storage 12 mo | Storage 90 d | Delivery | **Total 12 mo** (mo / yr) | **Total 90 d** (mo / yr) |
|---|---|---|---|---|---|
| 100 | $644.67 | $163.73 | $95.63 | $740.30 / $8,883.60 | $259.36 / $3,112.32 |
| 1,000 | $6,415.92 | $1,606.55 | $956.25 | $7,372.17 / $88,466.04 | $2,562.80 / $30,753.60 |
| 10,000 | $64,128.42 | $16,034.67 | $9,562.50 | $73,690.92 / $884,291.04 | $25,597.17 / $307,166.04 |

### Headline comparison: 1,000 students, 720p, annual

| Candidate | 12-month retention | 90-day retention |
|---|---|---|
| Bunny Stream | $6,330.84 | $2,533.92 |
| R2 DIY | $7,657.80 | $1,962.48 |
| Supabase Storage | $18,718.92 | $10,631.64 |
| Mux | $69,274.56 | $20,674.56 |
| api.video | $88,466.04 | $30,753.60 |
| Cloudflare Stream | $141,870.00 | $40,590.00 |
| Vimeo | Enterprise (unpublished) | Enterprise (unpublished) |
| YouTube | $0 (prohibited) | $0 (prohibited) |

Retention policy is the largest cost lever for per-minute platforms. Stored minutes outnumber delivered minutes 4 to 1 under 12-month retention.

A hybrid is cheap. Host only the 20 h library on Cloudflare Stream or Mux, and the student uploads on Bunny or R2. On Stream, the library costs 1,200 min stored ($6/month) plus 250,000 min delivered each month at 1,000 students ($250/month).

## 6. Audio fidelity (decision 4)

| Candidate | Re-encodes audio? | Codec and bitrate | Can the original be kept and served? |
|---|---|---|---|
| YouTube | Yes | Opus about 128 kbps (itag 251) or AAC about 128 kbps (itag 140). Community sources only, **unverified**. [S46] | No. Separating audio or caching is also prohibited. [S1] |
| Vimeo | Yes | Resamples to 48 kHz. Delivered bitrate is unpublished. Recommends uploading AAC-LC and notes that 320 kbps is "higher than necessary to achieve transparent audio quality". [S47] | The owner can download the source on paid plans (**unverified**). Playback uses transcodes. |
| Cloudflare Stream | Yes, to AAC | Bitrate unpublished (**unverified**). Downmixes more than 2 channels to stereo. [S18] | No: "You cannot download the exact input file." M4A and MP4 downloads are generated from the encode and billed as delivered minutes. [S18] [S48] |
| Mux | Yes | Bitrate unpublished (**unverified**). An audio-only M4A static rendition exists. [S49] | Master access gives a mezzanine "equivalent in quality to the original", not the original. The URL expires after 24 h. [S50] |
| Bunny Stream | Yes | Bitrate unpublished. Its encoding settings mention "pre-tuned bitrates that users can customize", but it is **unverified** whether that covers audio. [S28] | Yes, stored with "Keep original files". [S33] Serving the original through the CDN for playback is **unverified**. |
| api.video | Yes | Unpublished (**unverified**). | **Unverified**. |
| R2 or Supabase DIY | Only if we transcode | Our choice. | Yes. The original is just an object. |

**Recommended minimum.**

- Serve AAC-LC at **160 kbps or more in stereo** (**128 kbps or more in mono**), at 48 kHz. Opus at 128 kbps or more is an equivalent alternative.
- Treat decision 3's 128 kbps audio-only tier as the absolute floor, not the target.
- Keep each student's original upload for at least the review window, so the coach can fall back to it when a rendition sounds wrong.
- This recommendation is a judgement based on codec behaviour, not a sourced standard. See I-14.

**Test before committing.** For each shortlisted host:

1. Upload a reference clip: sustained sung vowels plus a 20 Hz to 20 kHz sine sweep.
2. Download the delivered HLS audio rendition.
3. Inspect it with `ffprobe` and a spectrogram.

The test takes about an hour and settles the unpublished bitrates.

**Capture side.** No host can repair audio damaged at capture. Browser `getUserMedia` voice processing (echo cancellation, noise suppression, automatic gain control) is covered by the client brief under decision 4.

## 7. Recommendation

**Ranking**

1. **Bunny Stream.** Primary pick. It is managed and priced per GB like a CDN, with no encoding charge. It has tus uploads, token authentication including directory-level HLS signing, webhooks and kept originals. At 1,000 students and 720p it costs $6,331/yr with 12-month retention and $2,534/yr with 90-day retention. The CTO builds only the upload hand-off, the token signing and the webhook handler.
2. **R2 DIY.** Fallback. It is the cheapest option at scale, with full control of audio and originals and zero egress. The CTO must build and own transcoding, a Worker that authorises segments, and resumable multipart uploads.
3. **Mux.** Best developer experience. It is affordable only with 90-day retention, or for the library alone.
4. **Supabase Storage.** Attractive if Supabase becomes the core database, because it shares one identity model. Egress at $0.09/GB costs about three times more than Bunny at 720p. It is fine at audio-only or 480p for small cohorts.
5. **Cloudflare Stream.** An excellent product, but per-minute storage makes it the most expensive managed option once uploads are retained. Good for hosting the library alone.
6. **api.video.** Per-minute pricing and no edge on any criterion.
7. **Vimeo.** Pilot only. It hits its bandwidth caps at 1,000 students, controls access by domain only, and has unsettled ownership.
8. **YouTube.** Prohibited for this use.

**Conditions that would change the pick**

- Choose **R2 DIY** over Bunny if either of these is true:
  - The audio test shows Bunny's renditions below 128 kbps AAC, it cannot be configured higher, and the kept originals cannot be served.
  - Bunny's free encoder queues too long for the review workflow, and premium encoding ($0.05/min at 720p) erodes the margin. That would add 187,500 min × $0.05 = $9,375/month at 1,000 students' ingest.
- Choose **Mux** if the CTO will not own any video pipeline, retention is 90 days or less, and the budget can absorb about $20,700/yr at 1,000 students and 720p.
- Choose **Supabase Storage** if Supabase is chosen as the core database and the product settles on audio-only or 480p submissions.
- **Retention policy is a product decision, not an infrastructure one.** The 90-day tables cut costs by 60 to 75% on every platform. The CTO should settle retention before choosing a vendor, because per-minute platforms become competitive only with short retention.
- **Decision 7 (App Store payments)** is unaffected by the hosting choice. This brief assumes web-first billing through Stripe.

## Interpretations to confirm

- **I-1 Steady-state storage.** "Retain everything for 12 months" is modelled as a full year of ingest stored every month. First-year storage bills ramp up from zero and average about half the steady-state storage line.
- **I-2 Rolling 90 days.** Modelled as 3 twelfths of annual ingest, 9.375 h per student.
- **I-3 Feedback storage.** Coach feedback videos (12.5 h per student per year) are stored under the same retention as submissions. The 20 h library is always stored.
- **I-4 Months.** Decision 3's 50 weeks are spread evenly over 12 billing months. Uploads (ingress) are not counted as egress.
- **I-5 Single rendition.** Per-GB platforms are modelled at a single rendition at the tier bitrate. Adaptive ladders and kept originals are handled only in the sensitivity note.
- **I-6 Mux assumptions.**
  - Basic quality at list price.
  - Volume discounts not applied; the $20 credit not subtracted.
  - The 100,000 free delivery minutes apply to all minutes, audio included.
  - 480p is billed at the "up to 720p" rate.
- **I-7 Cloudflare Stream rounding.** Prepaid storage is rounded up to the next 1,000 minutes. It is assumed audio-only content bills at the same per-minute rate, which is unconfirmed.
- **I-8 Bunny rates.** $0.01/GB single-region storage and Standard-network delivery for Europe and North America. Viewers elsewhere, or extra replication regions, cost more.
- **I-9 Supabase caching.** Submissions and feedback egress is treated as uncached, and library egress as cached. Supabase compute add-ons are ignored.
- **I-10 R2 operations.** Operation counts are estimates: 600 reads per delivered hour and 100 writes per ingested hour. The 10 GB free storage is ignored.
- **I-11 DIY transcoding.** Transcoding is excluded because browser-side encoding with MediaRecorder is assumed. A server ffmpeg worker is an extra cost we have not measured.
- **I-12 Vimeo assumptions.**
  - "Best fit" means Standard, for player branding.
  - Stored size is at our tier bitrate, although Vimeo counts source file size.
  - The 2 TB soft threshold is treated as binding.
  - Vimeo has no per-user signed playback. We inferred this from the privacy options pages.
  - USD plan prices are **unverified**.
- **I-13 Content ID applies to unlisted and private uploads.** Google's page says every upload is scanned and gives no privacy exception. The page does not state explicitly that non-public videos are scanned.
- **I-14 Audio minimum.** The 160 kbps stereo / 128 kbps mono recommendation is a judgement, not a cited standard.
- **I-15 YouTube paywall reading.** Policy III.F.3.a ("must not charge users to watch content in an embedded YouTube player") is read as covering a subscription that gates embedded videos. YouTube could approve an exception, but that would need prior written approval.
- **I-16 Currency.** Figures are in USD, excluding VAT. UK VAT at 20% applies to Vimeo and probably to the others.

## Sources

All sources accessed 2026-09-23.

- [S1] YouTube API Services Developer Policies: https://developers.google.com/youtube/terms/developer-policies
- [S2] YouTube embedded player parameters: https://developers.google.com/youtube/player_parameters
- [S3] YouTube Terms of Service (effective 17 March 2025): https://www.youtube.com/static?template=terms
- [S4] How Content ID works: https://support.google.com/youtube/answer/2797370
- [S5] Private and unlisted videos: https://support.google.com/youtube/answer/157177
- [S6] YouTube Data API videos.insert: https://developers.google.com/youtube/v3/docs/videos/insert
- [S7] Vimeo pricing page (rendered, UK locale): https://vimeo.com/upgrade-plan
- [S8] Third-party Vimeo USD pricing summary (secondary): https://swarmify.com/blog/vimeo-pricing-bandwidth-limits/
- [S9] Bandwidth on Vimeo: https://help.vimeo.com/hc/en-us/articles/12426275404305-Bandwidth-on-Vimeo
- [S10] Vimeo video privacy features: https://vimeo.com/features/video-privacy
- [S11] About Vimeo plans: https://help.vimeo.com/hc/en-us/articles/12425432033937-About-Vimeo-plans
- [S12] Vimeo API uploads: https://developer.vimeo.com/api/upload/videos
- [S13] TechCrunch on Bending Spoons (secondary): https://techcrunch.com/2026/07/05/what-is-bending-spoons-everything-to-know-about-aols-acquirer/
- [S14] CineD on Vimeo layoffs (secondary): https://www.cined.com/vimeo-layoffs-eliminate-majority-of-staff-just-four-months-after-1-38b-acquisition/
- [S15] Cloudflare Stream pricing: https://developers.cloudflare.com/stream/pricing/
- [S16] Securing Stream (signed URLs): https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/
- [S17] Stream direct creator uploads: https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/
- [S18] Stream FAQ: https://developers.cloudflare.com/stream/faq/
- [S19] Third-party Stream summary, source of the 1080p cap (secondary): https://verygoodffmpeg.com/blog/cloudflare-stream-pricing-video-api-encoding-storage-delivery-2026
- [S20] Mux video pricing documentation: https://www.mux.com/docs/pricing/video
- [S21] Mux secure video playback: https://www.mux.com/docs/guides/secure-video-playback
- [S22] Mux direct uploads: https://www.mux.com/docs/guides/upload-files-directly
- [S23] Mux pricing page: https://www.mux.com/pricing
- [S24] Bunny Stream pricing: https://bunny.net/pricing/stream/
- [S25] Bunny CDN pricing: https://bunny.net/pricing/cdn/
- [S26] Bunny storage pricing: https://bunny.net/pricing/storage/
- [S27] Bunny premium encoding: https://bunny.net/docs/stream/premium-encoding (prices from the search snippet; page not fetched in full, so treat as **unverified**)
- [S28] Bunny free encoding: https://bunny.net/docs/stream/encoding
- [S29] Bunny embed token authentication: https://bunny.net/docs/stream-embed-token-authentication
- [S30] Bunny CDN token authentication: https://docs.bunny.net/cdn/security/token-authentication
- [S31] Bunny tus resumable uploads: https://bunny.net/docs/stream/tus-resumable-uploads
- [S32] Bunny Stream webhooks: https://docs.bunny.net/stream/webhooks
- [S33] Bunny MP4 fallback: https://bunny.net/docs/stream/mp4-downloads (and the storage structure page https://docs.bunny.net/stream/storage-structure for "Keep original files")
- [S34] api.video pricing: https://api.video/pricing/
- [S35] Crunchbase on the OVHcloud acquisition of api.video (secondary): https://www.crunchbase.com/acquisition/ovh-com-acquires-api-video--127ad119
- [S36] Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- [S37] R2 presigned URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- [S38] Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- [S39] Cloudflare service-specific terms (CDN): https://www.cloudflare.com/service-specific-terms-application-services/
- [S40] Supabase pricing: https://supabase.com/pricing
- [S41] Supabase resumable uploads: https://supabase.com/docs/guides/storage/uploads/resumable-uploads
- [S42] Supabase serving downloads: https://supabase.com/docs/guides/storage/serving/downloads
- [S43] Vercel Flat Rate CDN: https://vercel.com/docs/pricing/flat-rate-cdn
- [S44] Vercel regional pricing: https://vercel.com/docs/pricing/regional-pricing
- [S45] Vercel Blob pricing: https://vercel.com/docs/vercel-blob/usage-and-pricing
- [S46] YouTube format itags, community source (secondary): https://gist.github.com/sidneys/7095afe4da4ae58694d128b1034e01e2
- [S47] Vimeo compression guidelines: https://help.vimeo.com/hc/en-us/articles/12426043233169-Video-and-audio-compression-guidelines
- [S48] Stream MP4 and M4A downloads: https://developers.cloudflare.com/stream/viewing-videos/download-videos/
- [S49] Mux static renditions: https://www.mux.com/docs/guides/enable-static-mp4-renditions
- [S50] Mux master access: https://www.mux.com/docs/guides/download-for-offline-editing
