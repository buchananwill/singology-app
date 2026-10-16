# Tag

A small uppercase pill that states a session's status: `<span class="sg-tag sg-tag--confirmed">Confirmed</span>`.

**Consumer provides:** a `<span>` with `sg-tag`, an optional status modifier, and a one- or two-word label.

| Modifier | Label | Colours |
| --- | --- | --- |
| `sg-tag--live` | *Live now* | `ink-on-brand` on `surface-brand`, with a dot |
| `sg-tag--confirmed` | *Confirmed*, *Booked* | `accent-olive` on `surface-tint` |
| *(none)* | *Pending*, *Draft*, *Taster* | `ink-muted` on `surface-alt` |
| `sg-tag--cancelled` | *Cancelled*, *Missed* | `danger` on `danger-soft` |

- The word carries the meaning; colour only reinforces it. Never use an empty or icon-only tag.
- One tag per card, beside the title.
- Not interactive — for filters, use buttons.
