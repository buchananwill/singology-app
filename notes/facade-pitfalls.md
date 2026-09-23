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
- **Workaround.** None applied in stage 1 (no media exists yet). Resolved in stage 2: `.gitignore` now has `!apps/web/public/media/**` after the audio rules, so generated fixture media is committed while personal recordings elsewhere stay ignored. `git check-ignore -v --no-index apps/web/public/media/student-take.m4a` reports the negation rule (`.gitignore:7`), and `recordings/lesson.m4a` still matches `*.m4a` (`.gitignore:3`).
- **Affects.** The founder demo: without the exception, a fresh clone would have no audio.
- **Evidence.** `.gitignore` lines 1 to 5 ("Source recordings: personal data, kept out of history").

## 4. Mantine 9 `Title` does not type `component={Link}` props

- **What happened.** `<Title component={Link} to="/">` failed type-checking: `Property 'to' does not exist on type 'IntrinsicAttributes & TitleProps & ...'`. `Title` is not a polymorphic component in Mantine 9's types. `Anchor` and `Button` are.
- **Workaround.** The header brand link uses `<Anchor component={Link} to="/">` with bold, large text.
- **Affects.** Later stages that want React Router links inside Mantine components: use a polymorphic component such as `Anchor`, `Button` or `UnstyledButton`, or wrap the element in a `Link`. Minor.
- **Evidence.** `tsc -b` error TS2322 in `apps/web/app/components/AppHeader.tsx`, Mantine `@mantine/core` 9.6.2.

## 5. Windows: pnpm misbehaves when the shell's path case differs from the folder's real case

- **What happened.** The repo folder is `D:\Coding\singology-app`, but shells opened at `D:\coding\singology-app` (lower-case `c`). In that state, `pnpm add <pkg>` run inside a workspace package crashed with `Cannot destructure property 'manifest' of 'manifestsByPath[rootDir]' as it is undefined`. `pnpm --filter <pkg> ...` from the root printed `No projects matched the filters "D:\coding\singology-app" in "D:\Coding\singology-app"`; `--filter <pkg> add` still worked, but `--filter <pkg> pkg set scripts.test=...` silently changed nothing.
- **Workaround.** Add dependencies with `pnpm --filter <pkg> add ...` from the root and check the resulting `package.json`; edit `scripts` by hand. Opening the shell at the correctly-cased path avoids the problem.
- **Affects.** Local development on Windows only. Neither the slice's runtime nor the founder demo.
- **Evidence.** pnpm 9.12.1 stack trace at `pnpm.cjs:198085`; `apps/web/package.json` had no `test` script after the `pkg set` call reported no error.

## 6. Workers static assets ignore HTTP Range requests, so media cannot be seeked reliably

- **What happened.** The fixture media is served from `apps/web/public` through the Workers static-assets handler. Under `pnpm preview` it answers `Range: bytes=0-99` with `200 OK` and the whole file, and sends no `Accept-Ranges` header. Chromium then treats the media as not seekable until it has downloaded all of it: a fresh `<audio preload="metadata">` reports `seekable` as `[0, 0]`, and setting `currentTime = 40` snaps back to `0`. Clicking a comment marker therefore lands on the comment only when the file happens to be fully buffered, which made the Playwright seek check flaky in Chromium. WebKit seeked correctly in every run (20 of 20 with `--repeat-each=4`). Public reports say the production static-assets handler behaves the same way, and that iPhones refuse to play `<video>` at all when the server does not answer Range with `206 Partial Content`. That has not been verified here, because nothing is deployed.
- **Workaround.** None in the product. This part of the spec is stopped and reported to the lead. The Playwright test checks that clicking a marker asks the media element to seek to the comment's time (it records every `currentTime` write) in both browsers. It checks the completed seek only in WebKit. The player code is correct: the seek works whenever the file is fully buffered.
- **Affects.** Both. The founder demo: seeking to comments, the loop and the waveform scrubbing can snap back to 0 in Chrome, and video may not play on an iPhone. The slice: media must be served with Range support, for example from R2 or Stream (D21), or through a Worker route that answers Range with `206`. This is a decision for the lead.
- **Evidence.** `curl -s -D - -o /dev/null -H "Range: bytes=0-99" http://localhost:4173/media/student-take-a.m4a` gives `HTTP/1.1 200 OK`, `content-length: 611219`, and no `Accept-Ranges`. The miniflare 5.20260921.0-alpha assets worker has no Range handling (no `content-range` in `dist/src/workers/assets`). Chromium evaluation: `{"seekable":[[0,0]],"t":0}` after `currentTime = 40`.
- **Facade resolution (decision 31, commit `87fbb4a`).** `wrangler.jsonc` binds `ASSETS` and sets `assets.run_worker_first: ["/media/*"]`, so the Worker entry hands `/media/*` to `serveMedia` ([workers/media/serveMedia.ts](../apps/web/workers/media/serveMedia.ts)) before React Router and the static handler. It reads the asset through `ASSETS` and answers `200` with `Accept-Ranges: bytes`, `206` with `Content-Range`, or `416`; multi-range requests get the full `200`. The same curl now gives `206 Partial Content`, `content-range: bytes 0-99/611219`, `content-length: 100`. The e2e test (commit `5df74ee`) asserts the completed seek in both browsers, with Chromium's audio throttled so the comment's time is unbuffered; with the route disabled it failed 6 of 6 in Chromium (`seeked` at 0). The slice is unaffected: its media comes from Bunny's CDN (D21).

## 7. Playwright's WebKit on Windows has neither native HLS nor Media Source Extensions

- **What happened.** In Playwright's WebKit build on Windows, `canPlayType("application/vnd.apple.mpegurl")` returns `""` and `Hls.isSupported()` is false. So the player uses the progressive MP4 for the HLS fixture, as `attachMediaSource` is designed to. Playwright 1.63's Chromium reports native HLS support, so by default it also skips hls.js.
- **Workaround.** The e2e test expects an HLS mode (`native-hls` or `hls.js`) only when the browser offers native HLS or MSE, and `progressive` otherwise. A separate Chromium test hides native HLS with an init script, so the hls.js path is exercised and reaches `readyState >= 1`. The native-HLS path is exercised by Chromium. Real Safari and iOS behaviour needs a device check.
- **Affects.** Test coverage only. Neither the slice's runtime nor the founder demo, but the iPhone path of decision 21 is not proven by automated tests.
- **Evidence.** The first WebKit run failed with `data-source-mode="progressive"` on the `<video>`, with `src="/media/test-pattern.mp4"`. In Chromium, a manual check showed `data-source-mode="native-hls"` with `currentSrc` `.../test-pattern-hls/index.m3u8`.
