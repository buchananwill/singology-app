---
title: "Slice Brand: Fixed Design Decisions"
type: decision-spec
status: proposed
---

# Slice Brand

This document fixes how the Singology brand, captured from the current choir site in the design system under [design-system/](./design-system/README.md), lands in the alpha. The source of truth for colour, type, shape and voice is `design-system/tokens.json` and its README; this document says which of those tokens the app expresses, where, and how, through Mantine's theme rather than the design system's own `sg-` CSS, because Mantine is the app's component system (journal 1 D19) and one component system is the house rule. The design system was written for a "1:1 sessions" product; its visual language transfers whole, its session-booking components do not.

The document fixes the roster (§1) and the decisions (§2). Declarations are fixed; bodies belong to the implementer.

## 1. Type Roster

**`notes/design-system/`** — the reference, committed as extracted; never imported by the app.

**`apps/web`, changed**

- `app/theme.ts` — the Mantine theme: `brand` (green), `navy` and `olive` colour tuples, `primaryColor: "brand"`, `black` set to Stage Navy, fonts, headings, radii, component defaults.
- `app/styles/brand.css` — the few things Mantine's theme cannot express: the `display` type style, the greyscale portrait, the focus ring colour, the serif voice class; imported once in `root.tsx`.
- `app/root.tsx` — Google Fonts `<link>`s in `Layout`'s head (preconnect, then the stylesheet for Jost and Bodoni Moda); imports `brand.css`.
- `app/components/shell/AppHeader.tsx` — the wordmark.
- `app/components/landing/HeroPanel.tsx` — new; the signature composition for the landing page.
- `app/components/CoachCard.tsx` — portrait, name and meta in the design system's coach treatment.
- `app/components/player/waveformTheme.ts` — brand colours for the waveform.
- `app/routes/home.tsx` — uses `HeroPanel`; an eyebrow above the hero; the rest unchanged.
- `e2e/smoke.spec.ts` — screenshots regenerate; assertions unchanged.

## 2. Decisions

### Colour

1. **Three colour tuples in the theme, derived from the tokens:** `brand` is a ten-step scale around Singology Green `#4fdb6d` (`green-300 #80e596`, `green-500 #4fdb6d`, `green-700 #1c7a34` at their natural positions), `navy` around Stage Navy (`navy-600 #35465c`, `navy-700 #373b4d`, `navy-900 #1f2230`), `olive` around Tutor Olive (`olive-500 #9db946`, `olive-700 #5b7020`); `primaryColor: "brand"`, `primaryShade` at the step holding `#4fdb6d`.
2. **Text on Singology Green is always navy, never white:** `theme.black` is `#373b4d` and `autoContrast` is on, so every filled brand button and badge gets navy text through Mantine's own contrast rule, and nothing hand-sets white on green; the README's contrast finding (white on green is 1.8:1) is the reason.
3. **Body text is the site's charcoal `#494947`, headings are Stage Navy, muted text is `#696969`, links are `green-700`,** set through the theme's CSS variables resolver (`--mantine-color-text`, `--mantine-color-anchor`) and `headings.color`, so `Text`, `Title` and `Anchor` carry the brand without per-use props.
4. **Olive appears only where a coach appears:** the coach tier badge and the coach-side accents use `olive`; students and the rest of the UI never do.
5. **Danger is the one non-brand hue** and keeps Mantine's `red`; it always arrives with a word, never as a colour alone.
6. **Light only in alpha:** `defaultColorScheme="light"` stays and no dark-mode mapping is built; the tokens file carries the dark theme for beta.

### Type

7. **Jost is the one sans face and Bodoni Moda italic the one serif**, loaded from Google Fonts by two `<link>` tags in `root.tsx` (preconnect to `fonts.gstatic.com`, then the stylesheet for Jost 300/400/500/600/700 and Bodoni Moda italic 400/500 with `display=swap`); no `@import` in CSS, because a `<link>` starts the download earlier and SSR emits it in the first bytes.
8. **`theme.fontFamily` is the token `--font-sans` stack and `theme.headings` is Jost 700 with the token sizes:** h1 44px, line-height 1, tracking −0.02em; h2 30px, weight 600, tracking −0.01em; h3 21px, weight 500, line-height 1.25; h4 and below Mantine's defaults scaled down; below 640px h1 steps to 34px and h2 to 26px through the theme's responsive heading sizes.
9. **`display` (72px, line-height 0.9, weight 700, tracking −0.035em, 48px below 640px) is a class in `brand.css` used once per page, on the landing hero only**; no other `Title` uses it.
10. **The serif voice is a class `voice` in `brand.css`** (Bodoni Moda italic, 22px, line-height 1.4) used for the coach's name on the coach card and for the one warm aside under the landing hero; never for labels, buttons or body copy.
11. **Buttons and nav use Jost 500, uppercase, 0.04em tracking** through `Button` and the nav `Button` default props (`tt: "uppercase"`, `fw: 500`, `lts: "0.04em"`), matching the site's Futura nav; every other control keeps sentence case.
12. **Eyebrows** (wide-tracked caps, 13px, weight 700, 0.28em) are a `Text` with those props, used above the landing hero ("For choir singers") and above section titles on the landing page only.

### Shape and space

13. **Square panels, round controls:** `defaultRadius: "sm"` (4px) for inputs and cards; `Button`, `Badge` and the nav pills get `radius: "xl"`; `HeroPanel` and any stage or brand panel have radius 0; the `Avatar` portrait is a circle.
14. **Flat by default:** `Card` default props are `withBorder` and `shadow: "none"`; `shadow-raised` is reserved for `Menu` and `Modal`, which Mantine already applies.
15. **Spacing keeps Mantine's scale** (it already matches the 4-to-64px steps); the content column stays `Container size="md"` and forms `maw={440}`.

### The signature composition

16. **`HeroPanel` is a full-bleed Singology Green ground with an inset Stage Navy panel**, radius 0 on both, padding `xl`, used once at the top of the landing page; inside it the heading and lead are white, muted text is `#c9cdd6`, the primary button is green with navy text, and focus rings are green.
17. **The landing hero reads: eyebrow "For choir singers", the existing h1 as `display`, the existing lead paragraph, the one serif aside "If you've never had a lesson, you're exactly who this is for.", then the "Sign in" button**; copy elsewhere on the page is unchanged.

### Coaches

18. **`CoachCard` becomes the design system's coach treatment:** a 120px circular portrait with `filter: grayscale(1)` (a `brand.css` class on the `Avatar`), the display name in the `voice` serif class, the tier badge in olive, then the bio and the turnaround line in muted text, centred; it keeps `data-testid="coach-name"` so the smoke test holds.
19. **An avatar with no image shows the initial** in a `surface-alt` disc, which is Mantine's `Avatar` fallback with `color="gray"`.

### Wordmark, waveform, focus

20. **The header wordmark is "Singology" in Jost 700 with tight tracking (−0.02em)**; no logo image exists and none is approximated (README, Logo).
21. **The waveform uses brand tokens:** wave `#80869a` (`line-strong`), progress Singology Green, cursor Stage Navy, comment markers olive, loop region a lime tint `#e4efb8` at 50% opacity; the facade's teal goes.
22. **Focus rings are a 2px solid Stage Navy outline offset 2px** on light grounds and Singology Green on navy grounds, set in `brand.css` through Mantine's `--mantine-color-...` variables and a rule on the hero panel, so keyboard users see the same ring everywhere.

### Voice

23. **Copy rules from the README are the house copy rules from now on:** British English, sentence case for everything typed (CSS uppercases buttons and nav), one exclamation mark per screen, no emoji, "we" and "you", plain words for technique, errors that are kind and specific; S8 changes no existing copy except the hero's eyebrow and aside, and every later brief carries this line.

### Tests

24. **The smoke suite's screenshots regenerate at 1280 and 375px** and its assertions do not change; the console-error check must stay clean with the fonts loading from Google (a blocked font request is not a console error, a failed one is, so the e2e run needs network).
25. **One Vitest unit test asserts the theme's invariants:** `primaryColor` is `brand`, `black` is `#373b4d`, `autoContrast` is true, the brand tuple holds `#4fdb6d` at `primaryShade`.

## 3. Deferred (explicitly out of scope)

- **Dark theme:** the tokens exist; beta.
- **A logo mark:** none exists; waiting on the founder.
- **Photography and coach portraits:** the alpha keeps the placeholder avatars; real greyscale portraits arrive with the founder's assets.
- **Iconography (Lucide):** nothing in the alpha needs icons beyond Mantine's defaults; adopt Lucide when the first icon is needed.
- **Adopting the `sg-` CSS classes:** never; Mantine is the component system.

## 4. Retirement

- The facade's placeholder teal `brand` tuple in `theme.ts` and the teal waveform colours are replaced.
- The root `singology-design-system.zip` is ignored by git (`/*.zip`); its contents live in `notes/design-system/`.
