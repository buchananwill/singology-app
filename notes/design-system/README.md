# Singology 1:1 design system

```html
<link rel="stylesheet" href="css/tokens.css">
<link rel="stylesheet" href="css/singology.css">
```

| Path | What |
| --- | --- |
| `css/tokens.css` | Every token as a CSS custom property, light and dark themes, type-style classes. Generated from `tokens.json`. |
| `css/singology.css` | The `sg-` component classes. Imports the Google Fonts. |
| `js/singology.js` | Optional theme helper (`Singology.setTheme('auto')`). |
| `tokens.json` | Source of truth for the tokens, with a usage note on each. |
| `components/<Name>/` | Usage guidelines (`README.md`) and a working example (`example.html`, open it in a browser). |
| `index.html` | Every example on one page, with a light/dark toggle. |

The visual and verbal language for **Singology 1:1**, the one-to-one vocal coaching platform that sits beside the Singology community choirs. It carries the choir site's look — Singology Green, Stage Navy, Tutor Olive and Lime, heavy geometric headlines with a Didot-style italic voice — into an app people use every week to book sessions, practise and talk to their coach.

Everything here is **plain CSS**: design tokens as CSS custom properties, components as `sg-` classes on ordinary HTML. It works the same in a static page, a server-rendered template, React, Vue, Svelte or an email-safe subset — nothing assumes a framework or a build step.

## Using it in any stack

1. **Load two stylesheets, in this order:** `css/tokens.css` (every token below as a `--custom-property`, plus the dark theme) and `css/singology.css`. The second `@import`s the two Google Fonts, so no extra font tags are needed.
2. **Add `class="sg-root"` to `<body>`** (or to the app's mount element). It sets the font, base colour, page ground and focus rings.
3. **Pick a theme** with `data-theme="light"` or `data-theme="dark"` on `<html>`. Light is the default. To follow the device setting without a framework:

   ```html
   <script>
     document.documentElement.dataset.theme =
       matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
   </script>
   ```
   (Or load `js/singology.js` and call `Singology.setTheme('auto')` — it is the only script in the system and is optional.)
4. **Compose with classes.** Block `sg-btn`, modifier `sg-btn--primary`, part `sg-session__title`. Never restyle a component by hard-coding a hex value — use `var(--token)`.
5. **Mark coloured grounds.** Any container painted `surface-stage` or `surface-brand` gets `sg-stage` or `sg-brand`; the panel classes already do. Inside, every component re-maps its text, link, button and focus colours, so a button on a navy panel and a button on white are the same markup.

| Need | Write |
| --- | --- |
| A page | `<body class="sg-root">` |
| A hero | `<section class="sg-panel sg-panel--stage">` inside `<div class="sg-panel sg-panel--brand">` |
| Headings | `.sg-display`, `.sg-h1`, `.sg-h2`, `.sg-h3`, `.sg-eyebrow`, `.sg-voice`, `.sg-lead`, `.sg-caption` |
| A button | `<button class="sg-btn sg-btn--primary">` (`--secondary`, `--coach`, `--quiet`, `--small`, `--block`) |
| Your own component | Use the tokens directly: `background: var(--surface-raised); color: var(--ink); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: var(--space-6);` |

## Content fundamentals

The choir site talks like a friendly choir leader at the door — new friends, amazing memories, feel-good songs, and *"Then you're in the right place!"* Keep that warmth, but 1:1 coaching is more personal and more serious about progress, so dial the exclamation marks down and the encouragement up.

- **We and you.** Singology is *we*; the singer is *you*; a coach is called by the name on their card (*Number One*, *Founder*). Never "the user", "the learner" or "the client".
- **Open to anyone.** The site's core promise is that singing is for *ANYONE*. Never assume ability: *If you've never had a lesson, you're exactly who this is for.* Don't write "beginner" as a label for people — describe the session instead (*first steps*, *getting to know your voice*).
- **Plain words for technique.** *Breath support*, *hitting higher notes*, *singing without strain* — not *appoggio* or *passaggio* unless a coach is writing to a singer who uses those words.
- **British English**, sentence case for everything you type (buttons and nav are uppercased by CSS). Dates: *Tuesday 20 October*; times 24-hour: *18:30–19:15*.
- **One exclamation mark per screen**, saved for genuine celebration: *That's your first month done!* Never in errors, payments or cancellations.
- **No emoji in the interface.** The choir's video descriptions use them; the platform does not.
- **Errors are kind and specific:** *Error: that email address looks incomplete.* Not *Invalid input*.
- **Examples.** Button: *Book a free taster*. Empty state: *No sessions booked yet. Your coach has times free this week.* Reminder: *Your session with Founder starts in 10 minutes — grab some water and do a quick hum.*

## Visual foundations

### Colour

The brand is **flat fields of strong colour**: green grounds, navy panels, lime for people. Lead with `green-500` and `navy-700`; use olive and lime only where coaches appear.

- Page ground is `surface` (white / deep navy). Use `surface-alt` for header bars and the space between cards, `surface-raised` for cards.
- **Text on Singology Green is always navy (`ink-on-brand`), never white** — white on `green-500` is 1.8:1. The choir site's white-on-green hero copy and white-on-olive About buttons fail contrast; this system deliberately does not repeat them.
- Green as *text* on light grounds is `accent-text` (`green-700`); olive as text is `accent-olive` (`olive-700`). The bright `green-500` and `olive-500` are fills.
- Body copy is `ink` (the site's charcoal `#494947`), headings `ink-strong` (Stage Navy), metadata `ink-muted`.
- `danger` is the only non-brand hue, and always arrives with a word.
- The **dark theme** keeps the brand fields identical and moves the page to `navy-900`; text becomes near-white, green becomes the link and focus colour. Panels look calmer in the dark — that is intended.

### Type

The site uses licensed Wix faces (Avenir Heavy and Light, Futura Book, Didot Italic, Lulo Clean). The platform uses free Google Fonts with the same character, and lists the originals as fallbacks:

- **Jost** (`--font-sans`, Futura-like) for headlines, UI and body. Headlines are heavy and tight (`display`, `heading-1`: 700, negative tracking) like the site's hero lines; body is light to regular (`body-large` at 300 for intros, `body` at 400).
- **Bodoni Moda Italic** (`--font-serif`, Didot-like) is the *voice*: the warm aside under a heading, coach names, quotes from coach feedback. Always italic, never more than two sentences, never for UI labels.
- **`eyebrow`** — wide-tracked caps (0.28em) in Jost Bold — stands in for the site's Lulo Clean *MEET THE TUTORS*. 2–4 words above a heading.
- Buttons and nav use `label`: Jost 500, uppercase, 0.04em tracking, after the site's Futura Book nav.
- One `display` per page. Below 640px headings step down (see `css/singology.css`).

### Shape, space and layout

- **Square panels, round controls.** Panels and date tiles have no radius (`radius-none`), like the site's slides. Buttons, nav, tags and progress bars are pills (`radius-pill`). Portraits are circles. Inputs and cards get a whisper of rounding (`radius-sm`).
- Spacing steps are `space-1` to `space-16` (4–64px). Cards pad `space-6`; panels `space-12`; sections sit `space-16` apart. Phone gutters `space-4`, desktop `space-8`.
- Content column max ~1040px, matching the site's centred panel; forms max ~440px.
- The **signature composition** is a navy stage panel inset on a full-bleed green ground. Use it once, at the top of key screens (home, booking).
- Flat by default: cards are separated by a `line` edge, not shadow. `shadow-raised` is for dialogs and menus only.

### Imagery

- **Real singers, mid-song**: candid, joyful, open mouths and clapping hands, as in the site's choir photography. Natural light, real rooms (church halls, studios, living rooms for online sessions). No stock models, no microphones-on-black clichés.
- **Coach portraits are greyscale circles**, head and shoulders, smiling — the site's tutor treatment. `sg-coach__portrait` applies the greyscale filter.
- Photos sit inside panels, overlapping the panel edge if you like (the site lets the photo break out of the navy slide); never put text over a busy photo.
- No illustrations or mascots. Where a picture is missing, use an initial in a `surface-alt` disc.

### Motion

Quick and quiet: colour transitions of 120ms ease on hover; no bouncing, no parallax. Respect `prefers-reduced-motion` in anything you add.

### States and focus

- Hover darkens fills slightly (`action-primary-hover`) or adds a 10% tint behind outlined buttons.
- **Focus** is a 2px solid ring, offset 2px: `focus` (navy in light, green in dark), switching to `focus-on-stage` (green) on navy panels and `focus-on-brand` (deepest navy) on green panels — the context classes do this for you. Every ring is at least 3:1 on the ground it lands on.
- Disabled controls drop to 45% opacity and keep their label.
- Current page and selected states change **shape or weight as well as colour** (the white nav pill, a heavier label).

## Iconography

The choir site uses only social-network glyphs, so there is no house icon set. Use **Lucide** (lucide.dev; MIT, plain SVG, no framework needed) at 20px with a 1.75 stroke, coloured `currentColor` so icons follow the text colour of their context. Keep icons beside words, not instead of them — except for universally understood controls (close, play, back), which still need an `aria-label`. No emoji.

## Logo

No logo file was available from the choir site, which sets *Singology* in its headline type. Until the brand provides a mark, set **Singology** in Jost Bold, tight tracking, with *1:1* beside it in the same weight — and never redraw or approximate a mark.
