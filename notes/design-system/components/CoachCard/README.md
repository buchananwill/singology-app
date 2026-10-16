# CoachCard

A centred coach introduction — circular greyscale portrait, italic serif name, specialisms and a coach button — taken from the site's *Meet the tutors* page: `<article class="sg-coach">`.

**Consumer provides:** a portrait as `<img class="sg-coach__portrait" src alt="Number One">` (or a `<div class="sg-coach__portrait" role="img" aria-label>` holding an initial when there's no photo); the coach's name and home choir in `.sg-coach__name`, separated by `<span class="sg-coach__sep">|</span>`; a one-line `.sg-coach__meta`; one `sg-btn--coach` link.

- Portraits are always greyscale (the class applies `filter: grayscale(1)`), head and shoulders, smiling, cropped square before upload so the face sits in the centre of the disc.
- Keep the name short on cards — *Number One | South Croydon*, *Founder | Wimbledon*. Longer bios belong on the profile page.
- Specialisms: three or four, comma-separated, plain words (*breath support*, not *diaphragmatic technique*).
- Put cards in a `<div class="sg-coach-row">` (centred, wrapping, top-aligned) on a `sg-panel--tint` ground — three across on desktop, stacked on phones.
