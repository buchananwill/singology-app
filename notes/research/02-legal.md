---
title: "WP2 Research: Copyright, Licensing, Safeguarding and Data Protection"
type: research
status: draft
---

# WP2 Research: Copyright, Licensing, Safeguarding and Data Protection

Answers CTO question 2 in [gtm-vision.md](../gtm-vision.md), within decisions 5 (UK primary, US secondary) and 6 (minors and safeguarding in scope) of [gtm-journal-01.md](../gtm-journal-01.md). EU law is covered only where the UK still follows it as assimilated (formerly "retained") EU law.

> **This is not legal advice.** It is research to help the CTO frame decisions and brief a solicitor. Every conclusion below is provisional until a UK solicitor with music-copyright and data-protection experience has reviewed it. The points that must go to a solicitor are listed in [Questions for a solicitor](#questions-for-a-solicitor).

All web sources were accessed 2026-09-23 (see [Sources](#sources)). Claims not confirmed against a primary source in this session are marked **unverified**. Points where this brief had to interpret the law are collected in [Interpretations to confirm](#interpretations-to-confirm).

## Summary

1. **Which rights are engaged.** A student recording a cover engages the **reproduction** right in the song and lyrics, and so does every copy the platform stores or transcodes. A private one-to-one upload to one coach is **probably not a "communication to the public"**: CJEU case law, still followed in the UK, needs an indeterminate and fairly large audience. The **coach library is a communication to the public.**
2. **Educational carve-out: none.** Section 32 and private study both need a non-commercial purpose, and a paid platform fails that test. Criticism, review and quotation do not fit a whole song. The UK has no private-copying exception. US fair use is arguable for the student but weak for a paid platform. The honest position is "low risk", not "lawful".
3. **Backing tracks.** The original record adds label and performer rights no collective licenses on demand: the worst case. Bought karaoke tracks are licensed for the private circle only, and they cover the master recording, not the song. A **coach-made backing track removes the recording layer**; the song still needs licensing.
4. **Licensing.** PRS for Music offers small online licences from about £107 to £193 + VAT a year. PPL does not license on-demand use. US video needs publisher sync licences. Comparable services license from publishers (Musora, Smule) or avoid song uploads.
5. **Platform choice.** YouTube's licences cover YouTube, not us, and **its API policies forbid charging to watch embedded content.** Self-host and run Reg. 19 / DMCA s.512 takedown.
6. **Practical risk.** Low for private submissions; moderate for a public-facing library.
7. **Safeguarding and data.** Children's Code, DPIA, Online Safety Act (probably in scope), enhanced DBS with barred list for coaches of minors, UK hosting.
8. **Coaches.** Contractors, with a written IP licence and a clearance warranty.

## 1. Compositions: which rights are engaged

### 1.1 The layers of rights in a student submission

A student video of a cover song contains up to five separate rights:

| Layer | Owner | UK right engaged by the upload | Present when |
|---|---|---|---|
| Musical work (melody, harmony) | Composer / publisher | Copying (s.17), possibly communication to the public (s.20) | Always, for an in-copyright song |
| Literary work (lyrics) | Lyricist / publisher | Same as above | Always, if the words are sung |
| Sound recording of the backing | Record label or backing-track maker | Copying, communication | When singing over a recording |
| Performers' rights in the backing | Session musicians, featured artist | s.182A copying, s.182CA making available | When singing over a commercial recording |
| The student's own performance and new recording/film | The student | Not an issue: the student consents by uploading | Always |

**Copying (reproduction) is engaged in every case.** CDPA s.17(2) defines copying of a musical or literary work as "reproducing the work in any material form", which "includes storing the work in any medium by electronic means". The student's recording is a reproduction, and so are the platform's stored original and every transcode. The temporary-copies exception (s.28A) protects only copies that are "transient or incidental" with "no independent economic significance". It does not cover persistent storage or stored transcodes.

**Public performance (s.19) is not engaged** by an online transmission. Online delivery falls under s.20 (communication to the public) instead. s.19 would matter only if a coach played the recordings at a live event.

### 1.2 Is private, authenticated, one-to-one sharing "communication to the public"?

s.20(2)(b) defines making available as making a work available "to the public ... in such a way that members of the public may access it from a place and at a time individually chosen by them". The question is whether a single coach, behind a login, is "the public".

The CJEU line of cases:

- **"Public" means an indeterminate number of potential recipients and a fairly large number of people.** *Reha Training v GEMA* (C-117/15, 31 May 2016) calls this a de minimis threshold that "excludes groups of persons which are too small or insignificant". Recipients must be "persons in general", not "specific individuals belonging to a private group".
- **A transmission to a closed, defined group is not to the public.** *BY v CX* (C-637/19, 28 October 2020) held that emailing a photograph to a court as evidence was an act of communication, but not to a public. The court was "a clearly defined and closed group of persons".
- **The "new public" test** (*SGAE v Rafael Hoteles* C-306/05; *Svensson* C-466/12; *ITV v TVCatchup* C-607/11; **unverified**, citations from general knowledge and not fetched this session). It asks whether a public exists at all and, if it does, whether it is one the rightsholder did not contemplate. The test only arises once there is a "public".
- **Platform operators.** *YouTube and Cyando* (C-682/18 and C-683/18, Grand Chamber, 22 June 2021) held that a platform operator does not itself communicate user uploads to the public merely by providing the infrastructure. It does so where its intervention goes further, for example where it knows about the infringement and fails to act.

**UK position after Brexit.** In *TuneIn Inc v Warner Music UK Ltd* [2021] EWCA Civ 441, the Court of Appeal declined to depart from the CJEU communication-to-the-public case law. The higher courts can depart from assimilated EU case law under s.6 of the European Union (Withdrawal) Act 2018, and the Retained EU Law (Revocation and Reform) Act 2023 changed the departure test. Commencement of that change was reported as paused in 2024 (**unverified**; secondary source only). In practice, UK courts still apply the CJEU framework.

**Assessment.** A student's upload, viewable only by the student and one assigned coach, is addressed to a specific individual. That is much closer to *BY v CX* than to a public. **It is probably not a communication to the public.** The assessment would weaken if any of these happens:

- recordings become viewable by other students, all coaches, a "showcase" feed or group classes;
- the platform aggregates submissions so that "the platform's audience of coaches", taken cumulatively, looks like an indeterminate group (the CJEU considers cumulative effect in some cases);
- recordings are shared by link without authentication.

The **coach exercise library** is different. It is available to every paying subscriber at a time they choose, so it is making available to the public. Any copyrighted song in it needs a licence.

**US position (secondary).** 17 USC 106(4) public performance covers transmissions "to the public". *Cartoon Network v CSC Holdings* ("Cablevision", 536 F.3d 121, 2d Cir. 2008) treated transmissions from unique per-user copies as not public. *ABC v Aereo* (573 U.S. 431, 2014) narrowed that approach for services that look like cable. Both citations are **unverified** (from general knowledge, not fetched). One-to-one coach review is at the private end of that spectrum. The reproduction right under 106(1) is engaged regardless.

## 2. Exceptions and carve-outs

| Exception | Text (key condition) | Fits our use? | Verdict |
|---|---|---|---|
| **CDPA s.32** illustration for instruction | Fair dealing "for the sole purpose of illustration for instruction", "for a non-commercial purpose", "by a person giving or receiving instruction", with sufficient acknowledgement | Student and coach are giving and receiving instruction. The paid service is commercial. | **Fails on non-commercial purpose.** A coach paid per student and a platform taking a cut are commercial. The student's own purpose is arguable, but the dealing we facilitate is commercial. |
| **s.29** research / private study | s.29(1C): fair dealing "for the purposes of private study". s.178: private study "does not include any study which is directly or indirectly for a commercial purpose". s.29(3): copying by a person other than the student is not fair dealing in some multi-copy cases. | The student is studying, but the study is delivered through a paid service. The platform's copies are made by a third party. | **Weak.** It might cover the student's own recording for self-review. It does not cover platform storage or the coach's viewing of a paid service. |
| **s.30(1)** criticism or review | Fair dealing for criticism or review "of that or another work or of a performance of a work", with acknowledgement; the work must have been made available to the public | The coach criticises the student's *performance of a work*. | **Arguable in principle, weak in practice.** Wording that reaches criticism "of a performance of a work" is tempting (see [Interpretations to confirm](#interpretations-to-confirm)). But fair dealing weighs the amount taken, and a whole song is hard to justify. It also protects the critic's use more naturally than the student's reproduction. |
| **s.30(1ZA)** quotation | Fair dealing, extent "no more than is required by the specific purpose", with acknowledgement | Short excerpts (a phrase, a chorus) submitted to work on a technique | **Plausible for short excerpts only.** It supports a product rule favouring short excerpts. It will not cover whole songs. |
| **Private copying (former s.28B)** | Introduced in 2014, then quashed in *R (BASCA) v Secretary of State for BIS* [2015] EWHC 2041 (Admin) | None | **Does not exist in UK law.** |
| **s.28A** temporary copies | Transient or incidental copies with no independent economic significance | Streaming buffers only | **Covers transient buffers, not stored recordings.** |
| **US fair use, 17 USC 107** | Four factors: (1) purpose, "including whether such use is of a commercial nature or is for nonprofit educational purposes"; (2) nature of the work; (3) amount; (4) effect on the market | Teaching is a listed purpose. | **Mixed.** Factor 1 favours a student practising; a paid platform less so, and transformativeness is limited because a cover reproduces the song for the song's own purpose (*Andy Warhol Foundation v Goldsmith*, 598 U.S. 508 (2023), **unverified**). Factor 2 disfavours: creative, published songs. Factor 3 disfavours: whole songs. Factor 4 is contestable: private one-to-one review does not substitute for the song, but a licensing market for educational song use exists (see section 4). |

**Clear verdict: there is no safe educational carve-out for a commercial platform in the UK.** The two education-specific exceptions (s.32 and s.29) are expressly limited to non-commercial purposes. The general fair-dealing exceptions (s.30) fit only short excerpts. US fair use gives a better argument for the student than for Singology. The defensible posture is:

- one-to-one submissions are *probably not* a communication to the public (section 1.2), so the exposure is limited to reproduction;
- short excerpts are favoured (quotation);
- enforcement risk is low (section 6);
- takedown is fast (section 5).

That is **risk management, not a carve-out**. Do not tell users or investors that the use is "covered by an educational exception".

## 3. Re-recordings and backing tracks

**(a) Singing over the original commercial recording.** This adds the label's sound-recording copyright (s.17 copying and s.20 communication) and the performers' rights of everyone on the record: s.182A for copying, and s.182CA for making available "without his consent" to the public. PPL, the UK collective for recordings, "does not manage the rights for on-demand streaming of specific tracks". On-demand services must license directly from each record label. This is **the worst case**:

- it is impractical to license;
- it is the most machine-detectable, because fingerprinting systems such as Content ID match original masters;
- it is not needed for teaching.

A private one-to-one upload probably still avoids s.20 and s.182CA, for the same reasons as section 1.2. Copying remains. **Product rule: discourage or disallow uploads that include the original record.**

**(b) A bought karaoke or backing track.** Karaoke Version, one large vendor, is a useful example of typical terms. Its standard purchase licence covers "personal use of the tracks in the private circle (with friends and family)". Using the tracks "on digital platforms like YouTube, Instagram etc. is not covered by the default licence". Its paid licences grant "Master Use" only. Composition rights must be obtained separately (from PRS, ASCAP and similar bodies, or publishers). So:

- the vendor's master is licensed only for the private circle;
- whether sending a recording to a paid coach is within the "private circle" is **not addressed** in their terms (see [Interpretations to confirm](#interpretations-to-confirm));
- the song itself is never licensed by the track purchase.

Risk is lower than (a), because the backing is not the original master, but it is not clean. Other vendors' terms vary; check each one.

**(c) A backing track the coach creates** (piano, guitar or DAW arrangement). This removes the third-party sound-recording and performer layers entirely. The coach owns the new recording (see section 8). The song remains: the coach's arrangement reproduces the musical work and is an "adaptation" of it. Distributing the arrangement to students is copying. Putting it in the library for all subscribers is communication to the public. **This is the cleanest practical option for song work**, provided the composition is licensed (PRS in the UK) or public domain.

**Coach library videos that use copyrighted songs.** These are on demand and open to every subscriber, so they are clearly a communication to the public:

- **Compositions** need a PRS for Music online licence in the UK (section 4).
- **Recordings:** original masters need direct label licences, which is impractical, so avoid them. Use coach-performed, production-music or public-domain audio.
- **US:** a video that sets a composition against pictures needs a **synchronisation licence** from the publisher. There is no compulsory sync licence (see section 4). The MLC blanket licence excludes audiovisual works.
- **Library design rule:** make the library's exercises (breathing, scales, dexterity, vowels) from **original or public-domain material**. Put copyrighted song content only where it is licensed.

## 4. Licensing routes

### 4.1 UK

| Licence | Issuer | Covers | Relevance | Cost |
|---|---|---|---|---|
| **TheMusicLicence** | PPL PRS Ltd | Playing music in business *premises* | **Not relevant.** PPL PRS state it does not cover on-demand online classes. | n/a |
| **Digital Music Licence for Fitness and Dance** | PRS for Music | "live streaming and On Demand streaming of fitness and dance classes online". PRS repertoire plus MCPS commercial and production music. UK operators under £150,000 a year. | **Closest published analogue** to a paid on-demand coaching library. Singing is not fitness or dance; ask PRS whether this licence or the e-learning variant applies. | "Fees start from £193 + VAT" for 12 months, adjusted for inflation |
| **Digital Music Licence (e-learning platforms)** | PRS for Music | Music in "live or on-demand courses" on e-learning platforms | **Most likely fit** for the coach library, and possibly submissions. Terms not retrieved (page is script-rendered). | **Unverified** |
| **Limited Online Music Licence (LOML)** | PRS for Music | Small online services. Historically capped at £12,500 a year of revenue from these activities; a PRS consultation reported the cap being removed. | Fallback for small scale | "From £107 + VAT" (**unverified**, secondary source) |
| **PPL** online licences | PPL | Linear webcasts only | **Does not license on-demand use.** "For music services that offer ... on-demand streams ... you will need to contact the recording rightsholders". | n/a |

PRS licences cover **PRS/MCPS repertoire, that is compositions and lyrics, not recordings**. PRS states its licences "don't cover content posted on third-party platforms like YouTube, Facebook or Instagram", because those platforms hold their own deals. A PRS licence is therefore a reason to self-host, not to use YouTube (section 5).

**Whether a PRS licence covers the student-submission flow is the key question for PRS.** Most PRS online tariffs are framed around the licensee's own content. Ask PRS in writing (see [Questions for a solicitor](#questions-for-a-solicitor)).

### 4.2 US

- **Public performance** (ASCAP, BMI, SESAC, GMR). Needed for the library if US subscribers stream it, since that is a transmission to the public. Private one-to-one review probably does not need it. Each PRO has digital licences; fees are **unverified**. GMR licenses by negotiation only.
- **Mechanical rights** (The MLC). The blanket licence covers "digital phonorecord deliveries" (downloads and interactive audio streams). The MLC and the Copyright Office state that a phonorecord **excludes sounds accompanying an audiovisual work**. **Video is not covered.**
- **Sync.** Negotiated directly with each publisher, or through aggregators (Hal Leonard licensing; Easy Song Licensing for covers, **unverified** for video). There is no compulsory licence, so this is expensive and slow per song.

### 4.3 What comparable services appear to do (public evidence only)

| Service | Evidence | Approach |
|---|---|---|
| **Musora** (Singeo, Pianote, etc.) | Help centre: songs carry "an extra cost" and are licensed via Hal Leonard | Licences song content from a publisher aggregator and passes the cost to users |
| **Smule** | Official songbook of licensed songs, separate from a community songbook (**unverified**, secondary sources) | Publisher licences for official content. Community uploads handled by takedown. |
| **Yousician** | ToS prohibits infringing content. Reported to have removed user-generated content when it launched licensed songs in 2018 (**unverified**, Wikipedia) | Licensed catalogue; user uploads of songs removed |
| **ArtistWorks** (Video Exchange) | ToS: users grant a licence and warrant "your User Content does not violate ... the rights of any third party". DMCA Copyright Agent named. | **Closest model to ours.** Shifts responsibility to the user, runs DMCA takedown, reserves a right to remove content. No public evidence of a licence for user submissions. |
| **Singing Carrots** | Built-in copyright-free MIDI; users upload their own MIDI | Avoids the problem with public-domain and user-supplied material |

**Pattern:** services that *publish* songs license them from publishers. Services that *receive* user performances rely on ToS warranties plus DMCA takedown. Singology's submissions are the second case; the library is the first.

## 5. Does platform choice change the position?

**Who is the primary infringer?**

- The **student** makes the reproduction when recording and uploading.
- **Singology** stores, transcodes and serves copies and designs the system. At minimum it is a host. It could be an authoriser or joint tortfeasor if it encourages uploads of infringing content.
- The **coach** views the upload. Viewing is not a restricted act in the UK. Downloading a copy would be.

Moving storage to YouTube or Vimeo moves *their* copies to *their* safe harbour. **Singology still operates the service that solicits and gates the content.**

**YouTube.** YouTube's licences with publishers and labels cover YouTube's own service. They do not extend to Singology's product. PRS says the same from the licensor side. More decisively:

- **YouTube API Developer Policies III.F.3.a:** "API Clients must not charge users to watch content in an embedded YouTube player." Login is permitted as normal app functionality, but charging for access to embedded content is not. **A paid library embedded from YouTube breaches YouTube's developer policies.**
- III.I.6 forbids modifying or blocking any part of the player, which conflicts with owning the look (vision Q1a).
- Content ID applies to uploads regardless of privacy setting (**unverified**), so student covers may be claimed or blocked.

**YouTube is unsuitable** for the paid library and poor for submissions.

**Vimeo.** The uploader warrants they have "the right to submit the content", and that "Vimeo will not need to obtain licenses from any third party or pay royalties". Vimeo licenses no music. Using Vimeo as a private backend changes nothing legally for Singology: the uploader is Singology or the student, and they carry the warranty.

**Self-hosting** (Supabase Storage, Cloudflare Stream, R2 and similar). Singology is the host. Liability shields:

- **UK: Electronic Commerce (EC Directive) Regulations 2002, reg. 19 (hosting).** Still in force. There is no liability for damages or criminal sanctions for stored information where the provider (a) has no actual knowledge of unlawful activity and is not aware of facts making it apparent, or acts "expeditiously to remove or disable access" on obtaining knowledge; and (b) the user "was not acting under the authority or the control of the service provider". **Condition (b) matters.** Student uploads fit. Coach library videos may not, if coaches act under Singology's control or the library is curated as Singology's product (see [Interpretations to confirm](#interpretations-to-confirm)). Reg. 19 does not stop an injunction.
- **US: 17 USC 512(c).** It requires:
  - no actual or "red flag" knowledge, or expeditious removal;
  - no "financial benefit directly attributable to the infringing activity" where the provider has "the right and ability to control" it;
  - a **designated agent registered with the US Copyright Office** and shown on the site (fee and renewal period **unverified**: believed to be $6 and every three years);
  - under 512(i), a **repeat-infringer termination policy** that is "reasonably implemented", and accommodation of standard technical measures.

  Subscription revenue is not usually "directly attributable" to infringement, but a paid review of a specific upload is closer (see [Interpretations to confirm](#interpretations-to-confirm)).

**Recommended notice-and-takedown process** (one process that meets both regimes):

1. A public copyright page and an email address such as `copyright@`. Register a DMCA agent with the US Copyright Office before any US launch.
2. A notice form collecting the elements of a 512(c)(3) notice: identification of the work, identification of the material, contact details, a good-faith statement, an accuracy statement under penalty of perjury, and a signature.
3. Disable access within a fixed service level, for example **2 business days**. Notify the uploader.
4. A counter-notice route (512(g)) with a 10 to 14 business-day restore window.
5. A logged strike register and a written repeat-infringer policy, for example termination after 3 upheld strikes.
6. Retain takedown records.

**Platform choice verdict:** self-hosting does not raise legal risk over YouTube or Vimeo. It lets Singology hold a PRS licence that actually applies, and it avoids a YouTube policy breach.

## 6. Practical risk

**Likelihood of enforcement against private submissions: low.** Rightsholders find infringement through public discovery: web crawling, Content ID and similar fingerprinting on public platforms, and complaints. Authenticated, one-to-one recordings are not visible to those systems. There is no public evidence found of enforcement against private coaching submissions (absence of evidence, **unverified**). The realistic triggers are:

- a public-facing element: a marketing page, public sample videos, social posts of student performances, or a shared link;
- a user or ex-coach complaint;
- PRS approaching a visible business that uses music online without a licence. PRS actively licenses small businesses.

**The library is the visible surface**, and PRS or publishers can see it if marketing shows song content.

**Cheap mitigations, in rough order of value:**

1. **A song-choice policy and product design.** Favour coach-made or public-domain backing tracks and short excerpts (quotation). Disallow uploads that include original commercial recordings. **Cost: nil** (policy text plus an upload checkbox).
2. **Keep submissions strictly one-to-one.** No sharing features, no public links, no showcase feed without a licence. This keeps them outside s.20 (section 1.2). **Cost: nil.** It is a product constraint.
3. **Library built from original or public-domain material.** Put copyrighted songs in only under a PRS licence (UK) and, for the US, sync licences. **Cost: about £193 to £500 a year** for PRS (estimate; e-learning tariff **unverified**).
4. **ToS allocation.** User and coach warranties, a licence to the platform, an indemnity, and acceptable use. Model: the ArtistWorks and Vimeo clauses quoted above. **Cost: solicitor drafting, estimate £1,500 to £5,000** (**unverified**, market estimate).
5. **Takedown process and DMCA agent** (section 5). **Cost: small fee plus about 1 day of build.**
6. **No public marketing that shows students singing copyrighted songs**, unless licensed. **Cost: nil.**

## 7. Safeguarding and data protection

### 7.1 Personal data

A video or audio recording of an identifiable student is **personal data** under UK GDPR. It is **not special-category biometric data** unless it is processed "using specific technologies" to uniquely identify the person. The ICO's example: identifying a colleague from a meeting recording "doesn't make the audio recording biometric data". The ICO also notes that the purpose defines whether data is special-category biometric data.

**Watch-out:** automated vocal analysis (pitch, tone or timbre scoring) is the kind of technical processing the ICO describes. It becomes special-category data only if used, or intended, to identify the person. Keep any analysis features explicitly non-identifying and document that in the DPIA.

### 7.2 Children

- **Consent age.** UK GDPR Art. 8: where **consent** is the lawful basis for an information society service offered directly to a child, the child must be at least **13**. Below 13, consent must be "given or authorised by the holder of parental responsibility", with "reasonable efforts to verify". The former DPA 2018 s.9 was omitted from 31 December 2020 because the age of 13 now sits in the UK GDPR text itself.
- **Lawful basis is not necessarily consent.** A paid coaching service probably relies on **contract** (Art. 6(1)(b)). For under-18s, the contract is in practice with the parent or guardian who pays. The Art. 8 age of 13 then matters for any consent-based processing, such as optional marketing or non-essential analytics.
- **Age Appropriate Design Code (Children's Code).** It applies to information society services "likely to be accessed by children", paid or free, established in or targeting the UK. Community-choir membership including under-18s makes Singology **in scope** if minors are admitted. Relevant standards:
  - best interests of the child;
  - a **DPIA** (standard 2);
  - high-privacy **default settings**;
  - data minimisation;
  - no data sharing by default;
  - parental controls with transparency to the child;
  - no nudge techniques;
  - geolocation off.
- **Data (Use and Access) Act 2025, s.81.** It amends Art. 25 UK GDPR so that services likely to be accessed by children must take "children's higher protection matters" into account. Reported fully in force by 19 June 2026 (**unverified**, secondary source).
- **Right to erasure (Art. 17).** It applies to recordings. The ICO gives particular weight to erasure requests about data collected when the subject was a child.

### 7.3 Online Safety Act 2023

This is not in the brief's question list, but it is material. The Act covers **user-to-user services**, including private messaging and file sharing, regardless of size. Students uploading content that a coach (another user) encounters **probably makes Singology a user-to-user service.**

The Schedule 1 exemptions do not obviously apply:

- "one-to-one live aural communications" is live and voice-only;
- "limited functionality" covers only comments and reviews on provider content;
- the education and childcare exemption is limited to listed providers, such as schools, operating the service for education at those institutions.

If in scope, Singology needs at least:

- an **illegal content risk assessment**;
- a **children's access assessment**, and a children's risk assessment if children can access the service;
- reporting and complaints routes;
- records.

Use Ofcom's Regulation Checker first. This is a solicitor question (see [Interpretations to confirm](#interpretations-to-confirm)).

### 7.4 Safeguarding and DBS

Under the Safeguarding Vulnerable Groups Act 2006, Sch. 4, regulated activity with children includes "any form of teaching, training or instruction of children" when carried out frequently or under the period condition. GOV.UK guidance gives the test as "more than 3 days in a 30-day period, or once overnight between 2am and 6am with the opportunity for face-to-face contact". People in regulated activity are eligible for an **Enhanced DBS check with Children's Barred List**. A barred person must not do it.

- **From 1 September 2026** the supervision rule no longer applies. A supervised person who teaches children often enough is now in regulated activity (GOV.UK). The amending Act is reported as the Crime and Policing Act 2026 (**unverified**).
- **Does remote, asynchronous feedback count?** The statutory wording ("any form of teaching ... instruction") contains no in-person requirement. The "face-to-face contact" wording attaches to the overnight limb in the guidance. GOV.UK guidance does not address online tuition explicitly. **Treat an active coach of a minor (feedback on more than 3 days in 30) as in regulated activity** unless a solicitor advises otherwise. This is an interpretation (see [Interpretations to confirm](#interpretations-to-confirm)).
- **Self-employed coaches.** Since 21 January 2026, self-employed people in regulated activity can reportedly obtain Enhanced DBS checks with barred list through an umbrella body (**unverified**, secondary source). Singology, as the platform that arranges the activity, can also register with an umbrella body.
- Moderating a public interactive service "likely to be used wholly or mainly by children" is a separate regulated activity. It does not apply unless the service is mainly for children.

**Recommended safeguarding baseline** (policy, not law; based on common practice, **unverified** against a specific NSPCC or CPSU standard):

1. A named **Designated Safeguarding Lead** and a written safeguarding policy, reviewed yearly.
2. **Enhanced DBS with Children's Barred List** for every coach who may be assigned a minor. Recheck, or require the DBS Update Service, every 3 years. References and identity checks at onboarding.
3. **All coach–student contact stays on-platform.** No personal phone numbers, social accounts or off-platform video. The platform retains messages and feedback.
4. **Parent or guardian account linkage for under-18s.** The parent consents, pays, and can see all feedback and messages.
5. **Recording guidance for minors:** a common area, not a bedroom; appropriate dress; no identifying school uniform; a parent aware of each upload.
6. A **concern-reporting button** that reaches the DSL. Written escalation to the local authority designated officer (LADO) and police where required.
7. Coach **code of conduct** and safeguarding training on onboarding.
8. Consider an **18+ at launch** option if the above is too heavy for an MVP. It removes the Children's Code, most DBS scope and much OSA children's duties in one step.

### 7.5 Retention, erasure and hosting location

- **Retention.** Set a stated period, for example submissions deleted 90 days after feedback, or 12 months, matching decision 3's two storage models. Offer the student download-then-delete. Delete on account closure, subject to a short safeguarding-evidence hold decided in the policy.
- **Erasure.** Build a hard delete across the original, transcodes, CDN caches and backups (backups age out). Log the erasure.
- **Hosting location.** UK or EEA hosting is simplest. The UK treats the EEA as adequate. For US processors, the **UK–US data bridge** (the UK Extension to the EU–US Data Privacy Framework, in effect since 12 October 2023) allows transfers only to US businesses with **active DPF status that have self-certified to the UK Extension**. Otherwise use the IDTA or the Addendum to the EU SCCs, with a transfer risk assessment.
  - Check each vendor on the DPF list: Supabase, Cloudflare, Vercel, Stripe, the email provider.
  - Transfers of biometric or criminal-offence data must be flagged as sensitive to the recipient. DBS results are criminal-offence data: **keep them out of the product database**, recording only "checked on date X, certificate number" if needed.
- **ICO registration.** Pay the ICO data protection fee (tier and amount **unverified**).

## 8. Coach relationship

- **Status.** A marketplace of independent **self-employed contractors** is the natural model: coaches set their own rates (the founder's brief describes different prices per coach), choose their hours and supply their own equipment. Employment status is decided on the facts, not by the contract label. Control over methods, exclusivity and set rates push towards "worker" status (**unverified**; get solicitor or accountant input). VAT treatment of a marketplace (agent or principal) is out of scope here but material.
- **IP in library videos.** Under CDPA default rules the **coach, as author, owns** their videos, unless they are an employee acting in the course of employment (s.11, **unverified**, not fetched). An assignment must be in writing signed by the assignor (s.90(3)). An exclusive licence must also be written and signed (s.92). Both are **unverified** (not fetched). The **Coach Agreement** should include:
  - a **non-exclusive, worldwide, royalty-bearing or royalty-free licence** to host, transcode, stream and promote the videos. The licence survives termination for a wind-down period, so current subscribers keep access for a stated time;
  - a **warranty** that the coach's content is original, public domain or licensed, and an **indemnity** for breach;
  - compliance with the song-choice policy and the safeguarding policy, and a DBS obligation;
  - confidentiality and data-processing terms. The coach processes student recordings, probably as Singology's processor or under its control, so an Art. 28-style clause is needed (see [Interpretations to confirm](#interpretations-to-confirm));
  - moral-rights handling (a waiver or consent for edits and thumbnails).
- **Student terms.** The student keeps ownership of their recording and grants a limited licence to Singology and the assigned coach to store, transcode and view it for the coaching service. The student warrants the song-choice rules. Coach feedback videos are owned by the coach and licensed to the student for personal use.

## Risk register

| # | Risk | Likelihood | Impact | Mitigation | Cost |
|---|---|---|---|---|---|
| R1 | Rightsholder claim over copyrighted songs in private student submissions | Low | Medium (takedown demand, possible damages claim for reproduction) | Keep submissions one-to-one; song-choice policy; takedown process; ToS warranties | Nil to low |
| R2 | Claim over submissions containing original commercial recordings (label and performer rights) | Low | Medium to high (labels are more litigious; no collective licence available) | Disallow original masters; favour coach-made or public-domain tracks | Nil |
| R3 | Unlicensed copyrighted songs in the coach library (public communication) | Medium | Medium (PRS back-licensing, publisher claim) | Original or public-domain library; PRS licence; US sync or geo-restriction | £193 to £500+ a year UK; US sync per song |
| R4 | Using YouTube embeds behind a paywall | High if chosen | Medium (API termination, loss of the library) | Self-host (see WP1) | Nil (architecture choice) |
| R5 | Loss of Reg. 19 or s.512 shield (no process, no agent, coach content "under control") | Medium | Medium | Takedown SOP; DMCA agent; strike policy; Coach Agreement | About 1 day of build plus fee |
| R6 | Children's Code or UK GDPR breach (no DPIA, poor defaults, missing parental involvement) | Medium if minors admitted | High (ICO action, reputation) | DPIA; parent-linked accounts; high-privacy defaults; retention policy | Solicitor review plus 2 to 5 days of build |
| R7 | Online Safety Act non-compliance (no risk or children's access assessment) | Medium | Medium to high (Ofcom enforcement) | Ofcom checker; written assessments; reporting tools | 1 to 3 days plus possible advice |
| R8 | Safeguarding incident (coach misconduct with a minor) | Low | Severe | Enhanced DBS with barred list; on-platform-only contact; DSL; parent visibility; or 18+ at launch | DBS cost per coach (**unverified**) plus policy |
| R9 | International transfer without a valid mechanism | Low to medium | Medium | UK or EEA regions; DPF list check; IDTA | Nil to low |
| R10 | Coach IP dispute on exit (library videos withdrawn) | Medium | Medium | Written licence surviving termination | Included in the Coach Agreement |
| R11 | Coach employment-status reclassification | Low to medium | Medium | Structure as a genuine marketplace; solicitor or accountant review | Advice fee |

## Questions for a solicitor

1. Is a private, authenticated upload viewable only by one assigned coach a "communication to the public" under CDPA s.20 and s.182CA? Does the answer change as the platform grows to hundreds of coaches?
2. Can any student or coach purpose on a paid platform be "non-commercial" for s.32 or s.29? Does s.30(1) criticism or review "of a performance of a work" cover whole-song submissions?
3. Is Singology an authoriser or joint tortfeasor of students' reproductions because it solicits song submissions? How far do ToS warranties and an indemnity protect it?
4. Does reg. 19 protect Singology for coach library content, given the "authority or control" condition?
5. Is a US subscription coaching service's revenue a "financial benefit directly attributable" to infringement under 512(c)(1)(B), where a user pays per review?
6. **For PRS for Music, in writing:** which licence (Digital Music Licence for e-learning, for fitness and dance, or LOML) covers (a) a coach library and (b) student submissions of cover performances? At what fee and territory?
7. Is singing over a bought karaoke track and sending it to a paid coach within the vendor's "private circle" licence?
8. Is the service a user-to-user service under the Online Safety Act 2023? Which duties apply at our size, and when?
9. Is remote, asynchronous feedback to a child on more than 3 days in 30 "teaching, training or instruction" in regulated activity under SVGA 2006 Sch. 4, following the 1 September 2026 change? Who must obtain the check, Singology or the coach?
10. Lawful basis for minors: contract with the parent, or with the child? At what age can a child contract for this service? What does Art. 8 require in practice?
11. Is each coach a processor, a joint controller or a separate controller for student recordings?
12. Coach status (self-employed, worker or employee) under the proposed marketplace model, and the VAT treatment of the platform fee.

## Interpretations to confirm

These are points where this brief had to interpret law or terms rather than read a clear answer. They are flagged, not resolved.

- **I1. One-to-one is not "the public".** Applying *Reha Training* and *BY v CX* to a paid one-to-one coach review is an extrapolation. No case found addresses a coaching platform. Cumulative effect across many coaches is untested.
- **I2. The "non-commercial purpose" in s.32 and s.178.** This brief treats the platform's commercial character as defeating the exception even though the student's own motive is learning. A court might analyse the student's dealing separately.
- **I3. s.30(1) "of a performance of a work".** The brief reads the exception as reaching coach criticism of a student's performance, while doubting whole-song fair dealing. Both halves are interpretation.
- **I4. Reg. 19 "authority or control"** as applied to contracted coaches' library uploads.
- **I5. Karaoke "private circle"** as applied to a paid coach. The vendor's terms are silent.
- **I6. Online Safety Act scope.** Treating student-to-coach uploads as user-to-user content, and the education exemption as unavailable, is an interpretation of Sch. 1.
- **I7. DBS scope for asynchronous remote teaching.** The "face-to-face" wording in guidance attaches to the overnight limb. This brief treats frequent remote feedback as regulated activity on a cautious reading of "any form of teaching".
- **I8. Assimilated EU case law.** The brief assumes UK courts continue to follow the CJEU communication-to-the-public case law (per *TuneIn*). The commencement status of the 2023 Act's new departure test is **unverified**.
- **I9. Vocal analysis and biometrics.** The brief assumes non-identifying pitch or tone analysis stays outside special-category data, based on the ICO purpose test.
- **I10. YouTube III.F.3.a.** The brief reads "must not charge users to watch content in an embedded YouTube player" as catching a subscription that includes embedded library videos. Google might accept a bundled service where the videos are incidental, but the text gives no such carve-out.

## Sources

All accessed 2026-09-23.

**Legislation**
- CDPA 1988 s.17 (copying): https://www.legislation.gov.uk/ukpga/1988/48/section/17
- CDPA 1988 s.20 (communication to the public): https://www.legislation.gov.uk/ukpga/1988/48/section/20
- CDPA 1988 s.28A (temporary copies): https://www.legislation.gov.uk/ukpga/1988/48/section/28A
- CDPA 1988 s.29 (research and private study): https://www.legislation.gov.uk/ukpga/1988/48/section/29
- CDPA 1988 s.30 (criticism, review, quotation): https://www.legislation.gov.uk/ukpga/1988/48/section/30
- CDPA 1988 s.32 (illustration for instruction): https://www.legislation.gov.uk/ukpga/1988/48/section/32
- CDPA 1988 s.178 (definitions, "private study"): https://www.legislation.gov.uk/ukpga/1988/48/section/178
- CDPA 1988 s.182CA (performers' making available right): https://www.legislation.gov.uk/ukpga/1988/48/section/182CA
- Electronic Commerce (EC Directive) Regulations 2002, reg. 19: https://www.legislation.gov.uk/uksi/2002/2013/regulation/19
- UK GDPR Art. 8: https://www.legislation.gov.uk/eur/2016/679/article/8
- Data Protection Act 2018 s.9 (omitted): https://www.legislation.gov.uk/ukpga/2018/12/section/9
- Online Safety Act 2023 Sch. 1 (exemptions): https://www.legislation.gov.uk/ukpga/2023/50/schedule/1
- Safeguarding Vulnerable Groups Act 2006 Sch. 4: https://www.legislation.gov.uk/ukpga/2006/47/schedule/4
- Data (Use and Access) Act 2025, explanatory notes: https://www.legislation.gov.uk/ukpga/2025/18/notes/division/10/index.htm
- Retained EU Law (Revocation and Reform) Act 2023 (Commencement No. 2) Regs 2024: https://www.legislation.gov.uk/uksi/2024/714/made
- 17 USC 107 (fair use): https://www.law.cornell.edu/uscode/text/17/107
- 17 USC 512 (safe harbours): https://www.law.cornell.edu/uscode/text/17/512

**Cases**
- *Reha Training v GEMA*, C-117/15 (31 May 2016): https://ipcuria.eu/case?reference=C-117%2F15
- *BY v CX*, C-637/19 (28 October 2020): https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62019CJ0637
- *YouTube and Cyando*, C-682/18 and C-683/18 (22 June 2021): https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A62018CJ0682
- *TuneIn Inc v Warner Music UK Ltd* [2021] EWCA Civ 441: https://www.bailii.org/ew/cases/EWCA/Civ/2021/441.html
- *R (BASCA) v Secretary of State for BIS* [2015] EWHC 2041 (Admin), reported: https://ipkitten.blogspot.com/2015/07/green-j-quashes-uk-private-copying.html (secondary)
- **Unverified, not fetched:** *SGAE v Rafael Hoteles* C-306/05; *Svensson* C-466/12; *ITV v TVCatchup* C-607/11; *Cartoon Network v CSC Holdings* 536 F.3d 121 (2d Cir. 2008); *ABC v Aereo* 573 U.S. 431 (2014); *Andy Warhol Foundation v Goldsmith* 598 U.S. 508 (2023).

**Regulators and government**
- ICO, Children's Code, services covered: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/services-covered-by-this-code/
- ICO, biometric data key concepts: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/biometric-data-guidance-biometric-recognition/key-data-protection-concepts/
- ICO, UK Extension to the DPF: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/adequacy-regulations/how-does-the-uk-extension-to-the-eu-us-data-privacy-framework-work/
- ICO, right to erasure and children: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/children-and-the-uk-gdpr-old/how-does-the-right-to-erasure-apply-to-children/
- ICO, DUAA 2025 overview: https://ico.org.uk/about-the-ico/what-we-do/legislation-we-cover/data-use-and-access-act-2025/the-data-use-and-access-act-2025-what-does-it-mean-for-organisations/
- GOV.UK, change to regulated activity from 1 September 2026: https://www.gov.uk/government/news/change-to-the-definition-of-regulated-activity-with-children-from-1-september-2026
- GOV.UK, eligibility for Enhanced with Barred List checks (children): https://www.gov.uk/government/publications/eligibility-for-enhanced-with-barred-list-dbs-checks-with-children/eligibility-for-enhanced-with-barred-list-dbs-checks-with-children
- Ofcom Regulation Checker: https://www.ofcom.org.uk/os-toolkit/regulation-checker/regulation-checker
- US Copyright Office DMCA Designated Agent Directory: https://www.copyright.gov/dmca-directory/
- The MLC, blanket licence: https://blog.themlc.com/resources/what-is-the-blanket-compulsory-mechanical-license

**Licensing bodies**
- PPL PRS, online fitness classes (Digital Music Licence for Fitness and Dance, £193 + VAT): https://pplprs.co.uk/themusiclicence/sectors/fitness-dance/online-fitness-classes/
- PPL, other online licences (on-demand not licensed by PPL): https://www.ppluk.com/licensing/playing-music-online/other-online-licences/
- PRS for Music, Limited Online Music Licence (page script-rendered; details from search snippets, **unverified**): https://www.prsformusic.com/licences/using-music-online/limited-online-music-licence
- PRS for Music, Digital Music Licence FAQs (script-rendered; **unverified**): https://www.prsformusic.com/licences/using-music-online/digital-music-licence/digital-music-licence-faqs

**Platform terms and comparables**
- YouTube API Services Developer Policies (III.F.3, III.I.6): https://developers.google.com/youtube/terms/developer-policies
- YouTube Terms of Service: https://www.youtube.com/static?template=terms
- Vimeo Terms of Service: https://vimeo.com/terms
- ArtistWorks Terms of Service: https://artistworks.com/legal
- Yousician Terms of Service: https://yousician.com/terms-of-service
- Musora / Pianote help, song licensing cost: https://help.pianote.com/article/1006-why-is-there-an-extra-cost-for-musora-songs
- Karaoke Version, personal-use licence: https://www.karaoke-version.com/help/self-licensing_330.html
- Karaoke Version, rights covered: https://www.karaoke-version.com/help/self-licensing_335.html
- Yousician (Wikipedia, secondary, **unverified**): https://en.wikipedia.org/wiki/Yousician
- Smule (Wikipedia, secondary, **unverified**): https://en.wikipedia.org/wiki/Smule
