# Progress

A labelled meter for practice minutes, song sections or course steps: a Singology Green fill on a Stage Navy track, with the value written out beside the label: `.sg-progress`.

**Consumer provides:** a `.sg-progress__label` with an `id`; a `.sg-progress__value` in words (*45 of 60 minutes*); the track with `role="progressbar"`, `aria-labelledby`, `aria-valuemin/max/now` and `aria-valuetext`; and the fill's `width` as a percentage.

- Always print the value as text — the bar is a glance, the words are the fact.
- Count things a singer recognises (minutes practised, sections learnt), never abstract scores or percentages alone.
- Celebrate a completed goal with a short line in the brand voice (*That's the whole song — brilliant!*), not with confetti or badges.
- Inside a stage panel the track darkens to `navy-900` automatically.
