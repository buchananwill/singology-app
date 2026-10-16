# SessionCard

One booked 1:1 session — a Stage Navy date tile beside the title, coach, time, status tag and actions: `<article class="sg-session">`.

**Consumer provides:** the date tile (`.sg-session__date` with `__month`, `__day`, `__weekday`, marked `aria-hidden="true"` because the full date is repeated in a `<time datetime>` inside `.sg-session__meta`); a `.sg-session__title`; `.sg-session__coach` as *with {coach name}* (e.g. *with Founder*); one `sg-tag`; up to two small buttons in `.sg-session__actions`.

- Title = what the session is about, in the singer's terms: *Breath support & belting*, *First session — getting to know your voice*.
- Time format: *Tuesday 20 October, 18:30–19:15* (24-hour, en dash, no leading "on"). Add the place or *Video call* after a middle dot.
- Actions: *Join session* is primary only within 10 minutes of start (show `sg-tag--live` then); before that the primary slot is empty and *Reschedule* is secondary.
- Stack cards with `space-4` between them on a `surface-alt` ground. On phones the date tile becomes a strip above the text.
