---
title: "Singology Facade: Pitfalls Log"
type: log
status: active
---

# Singology Facade: Pitfalls Log

One entry per real problem hit while building the facade (spec decision 28): what happened, the workaround, whether it affects the slice or the founder demo, and the evidence.

## 1. TypeScript `latest` is now 7, but the spec and the lint stack need 6

- **What happened.** `pnpm add typescript` would install TypeScript 7.0.2, because npm's `latest` tag moved to 7. The spec fixes TypeScript 6 (decision 1). Separately, `typescript-eslint` 8.70.1 (the current release) only supports TypeScript `>=4.8.4 <6.1.0`, so TypeScript 7 would also break linting.
- **Workaround.** Every package pins `typescript: ~6.0.3` explicitly. No deviation from the spec.
- **Affects.** The slice: moving to TypeScript 7 has to wait until `typescript-eslint` supports it. Not the founder demo.
- **Evidence.** `pnpm view typescript dist-tags` gives `latest: 7.0.2`; `pnpm view typescript-eslint@latest peerDependencies` gives `typescript: ">=4.8.4 <6.1.0"`.

## 2. Windows: stopping a backgrounded dev or preview server leaves `workerd.exe` running

- **What happened.** Killing a backgrounded `vite preview` or `react-router dev` (for example by closing the shell that started it) killed only the top process. The child `node.exe` processes and `workerd.exe` kept running and kept the port bound, so the next `--strictPort` start would fail.
- **Workaround.** Find the leftovers (`Get-Process workerd`) and stop them by process ID. Playwright's `webServer` cleans up its own preview server correctly, so the automated smoke runs are not affected.
- **Affects.** Local development on Windows only. Neither the slice's runtime nor the founder demo.
- **Evidence.** After stopping the shell task, `Get-Process workerd` still listed `workerd.exe` from `node_modules\.pnpm\@cloudflare+workerd-windows-64@1.20260921.1`, plus two `node.exe` processes running `vite preview`.

## 3. `.gitignore` ignores `*.m4a`, which conflicts with committing generated media

- **What happened.** The repo's `.gitignore` excludes `*.ogg`, `*.m4a`, `*.mp3` and `*.wav` to keep the founder's source recordings out of history. Decisions 22 and 23 say the generated fixture audio is AAC `.m4a` and is committed. As it stands, `git add` will silently skip it.
- **Workaround.** None applied in stage 1 (no media exists yet). The media stage needs a scoped exception such as `!apps/web/public/media/**/*.m4a`, placed after the ignore rule, so personal recordings elsewhere stay ignored.
- **Affects.** The founder demo: without the exception, a fresh clone would have no audio.
- **Evidence.** `.gitignore` lines 1 to 5 ("Source recordings: personal data, kept out of history").

## 4. Mantine 9 `Title` does not type `component={Link}` props

- **What happened.** `<Title component={Link} to="/">` failed type-checking: `Property 'to' does not exist on type 'IntrinsicAttributes & TitleProps & ...'`. `Title` is not a polymorphic component in Mantine 9's types. `Anchor` and `Button` are.
- **Workaround.** The header brand link uses `<Anchor component={Link} to="/">` with bold, large text.
- **Affects.** Later stages that want React Router links inside Mantine components: use a polymorphic component such as `Anchor`, `Button` or `UnstyledButton`, or wrap the element in a `Link`. Minor.
- **Evidence.** `tsc -b` error TS2322 in `apps/web/app/components/AppHeader.tsx`, Mantine `@mantine/core` 9.6.2.
