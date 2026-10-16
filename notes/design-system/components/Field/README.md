# Field

A labelled text input or textarea with optional help and error text: `.sg-field` wrapping `.sg-field__label`, `.sg-field__input`, and `.sg-field__help` or `.sg-field__error`.

**Consumer provides:** a real `<label for>` tied to the input's `id`; `aria-describedby` pointing at the help or error text; on error, `sg-field--invalid` on the wrapper **and** `aria-invalid="true"` on the input.

- Labels are questions or nouns in sentence case, in the coach's warm voice where it helps: *What would you like to work on?*
- Help text says why we're asking, not how to type. Errors start with *Error:* and say how to fix it, kindly: *That email address looks incomplete.*
- Borders use `line-strong` (3:1); invalid fields switch to a 2px `danger` border so the change shows in width as well as colour.
- Use `textarea.sg-field__input` for practice notes and session goals; it starts at 112px tall.
- Keep forms one column, max ~440px wide.
