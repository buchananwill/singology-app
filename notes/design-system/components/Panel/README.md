# Panel

A square-cornered block of solid colour — the site's slide panels — used for heroes, feature sections and coach areas: `<section class="sg-panel sg-panel--stage">`.

**Consumer provides:** a container element with `sg-panel` plus one ground modifier, and its contents (typically eyebrow, heading, lead, buttons). Children are spaced `space-4` apart automatically.

| Modifier | Ground | Text | Use for |
| --- | --- | --- | --- |
| `sg-panel--stage` | `surface-stage` (Stage Navy) | `ink-on-stage` | Heroes, the next-session spotlight, anything you want read first. |
| `sg-panel--brand` | `surface-brand` (Singology Green) | `ink-on-brand` | The brand ground behind a stage panel, celebration moments (streaks, milestones). |
| `sg-panel--tint` | `surface-tint` (Tutor Lime) | `ink` | Coach introductions and profile areas. |

- The signature composition is **a navy stage panel inset on a green brand ground**, as on the choir site's home page. Use it once per page, at the top.
- Each modifier re-maps the colour tokens for everything inside, so buttons, tags, links and focus rings stay legible without extra classes. To get the same effect on your own container, add `sg-stage` or `sg-brand` instead.
- Corners stay square (`radius-none`); rounding is reserved for controls and portraits.
- Panel padding is `space-12`, dropping to `space-6` below 640px.
- On a tint panel, coloured headings use `accent-olive`, not `olive-500`.
