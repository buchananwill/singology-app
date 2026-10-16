# Button

Pill-shaped, uppercase action buttons taken from the site's About pills and nav: `<button class="sg-btn sg-btn--primary">`, or the same classes on an `<a>`.

**Consumer provides:** a `<button>` (or `<a href>` for navigation), a label of one to three words, and one variant class. Add `sg-btn--small` for dense rows, `sg-btn--block` for full-width phone CTAs.

| Variant | Class | Use for |
| --- | --- | --- |
| Primary | `sg-btn--primary` | The one thing the screen is for: *Book a session*, *Join session*. At most one per view. |
| Secondary | `sg-btn--secondary` | Alternatives beside a primary: *Reschedule*, *Practice notes*. |
| Coach | `sg-btn--coach` | Anything about a coach: *View profile*, *Message Number One*. |
| Quiet | `sg-btn--quiet` | Low-stakes or destructive-but-reversible: *Cancel*, *Skip*. |

- Write labels verb-first in sentence case in the markup; the class uppercases them. Don't type them in caps (screen readers spell out some caps strings).
- Inside `.sg-stage` or `.sg-brand` (or a panel) the variants re-colour themselves; on a green panel the primary becomes navy with white text, because green-on-green would vanish.
- Never set white text on `green-500` or `olive-500` — both fail contrast (1.8:1 and 2.2:1).
- Minimum height is 44px for touch; don't override it below 36px (`sg-btn--small`).
- Disabled: the native `disabled` attribute, or `aria-disabled="true"` on links.
