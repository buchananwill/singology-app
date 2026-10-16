# Nav

The primary navigation bar: a full-width `green-300` pill of uppercase links, as on the choir site, with the current page marked by a white inner pill.

**Consumer provides:** a `<nav aria-label="Main">` containing `<div class="sg-nav">` and three to six `<a>` links; set `aria-current="page"` on the current one (that attribute drives the white pill — no extra class).

- Labels are single nouns: *Home*, *Sessions*, *Practice*, *Coaches*, *Messages*.
- Text is always `ink-on-brand`; the current page is shown by shape (the white pill) as well as weight, never by colour alone.
- Place it in a `surface-alt` header bar, centred with a max width of about 820px, as the site does; social or account icons sit to its right, outside the pill.
- Below about 480px the bar scrolls horizontally; with more than four items, switch to a bottom tab bar or a menu button instead.
