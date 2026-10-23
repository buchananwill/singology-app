---
title: "Singology Coaching Platform: Vision"
type: vision
status: active
---

# Singology Coaching Platform: Vision

This document is the users' own words, lightly arranged. It is edited only by the user. Every downstream document (plan, research, proposal) is measured against it; where one departs from it, that is a defect to raise.

## The founder's brief (voice note, 2026-08-13)

Source: [voice-note-transcript-2026-08-13.md](../voice-note-transcript-2026-08-13.md)

> I've got so many Singology members in my community choir who are after singing lessons, for which I just don't have the time.

> The PTs in the world do this thing where they have a whole load of videos that they send to their clients and their clients do the exercises, moves, blah blah blah. Then the client videos themselves and sends it back to the PT and the PT gives them feedback. That's the kind of thing that I want to do for singing, basically.

> How can we do this simply, easily? Does it need to be an app or is it just an online website? I feel if it's an app then there might be some music licensing issues that we might fall into, possibly, unless we host the videos offline on Vimeo or YouTube or whatever.

> So ultimately I'll have a bank of different coaches who the members will pay for. So if they're asking for me, they obviously want me to coach them so they'll pay a little bit more. But if they're looking for Kimberly, who's as good but not as well known, then they pay a little less, that kind of thing.

> And then they submit their stuff, but there's a whole host of videos in the background that they can use for breathing, for dexterity, blah blah blah, all that kind of stuff.

## The CTO's brief (2026-09-23)

The CTO is leading the build and owns its architecture decisions. They asked for a GTM proposal covering infrastructure, UX, CI and legal research. Their four key open questions:

1. **Video hosting.** Does YouTube support use as a platform embedding tool, or does that conflict with its public-oriented, ad-revenue model? What about Vimeo? Would bespoke hosting (e.g. Supabase / Cloudflare / Vercel) serve better? Principal concerns:
   - a) **Flexibility of access:** use the host as a video database; own the look and authentication of the frontend.
   - b) **Complexity of bootstrapping:** stereotyped infrastructure is cheap to assemble agentically, but tokens aren't free and the CTO must own the architecture decisions.
   - c) **Cost at our bandwidth:** upper bound of 30 minutes of student uploads per week, so about 25 hours per student per year. 100 students is about 2,500 hours; 1,000 students is about 25,000 hours. What does that cost per candidate platform, at different quality tiers?
2. **Copyright.** What legal considerations apply when students record and share popular copyrighted *compositions* **privately**? Is there a safe carve-out when recordings are educational and viewable only behind authenticated access? Does the position change if recordings include *re-recordings* of copyrighted recordings (original hits, backing tracks)? Does the choice of platform affect it?
3. **Client stack.** The CTO favours web-first: easier to iterate, roll out, demo, update and standardise. "The value is the remote, asynchronous relationship, not the technology per se." They have no budget for a dedicated Mac and iPhone. They currently build an Android app in Kotlin Multiplatform. **They explicitly want the counter-argument, not confirmation bias.** They are averse to Apple by habit and want the positive case for iOS/native they won't see for themselves, bearing in mind that many musicians have iPhones.
4. **Registration, auth, billing.** Assumed: we own a standalone core database (teacher/student tables, billing status, lesson notes/messages, educational tracking) regardless of media backend. Billing through a third party such as Stripe. We never directly handle financial personal data.

## Founder meeting (2026-10-16)

As reported by the CTO.

1. **The library is free of copyright risk, at least at first.** Its core content is non-copyright or Singology's own material: scales, technical exercises. No IP hazard.
2. **The platform is 1:1 asynchronous coaching, always.** Recordings pass between a student and their coach only. No sharing of recordings between students, and no social-media-style feeds of recordings.
3. **Habit-forming features come later, as a supplement.** In the long term, the founder wants nudges such as streaks, or leaderboards of completed exercises and collections, to make the platform more appealing and keep students coming back. They always sit beside the 1:1 coaching relationship and never replace it.
