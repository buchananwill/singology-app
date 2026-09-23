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

## 8. Playwright's WebKit on Windows cannot play media from `blob:` URLs, so the upload panel cannot read a picked file's duration there

- **What happened.** The upload panel (decision 19) plays the picked file through a plain `<audio>` or `<video>` with an object URL and reads the duration from `loadedmetadata`. In Playwright's WebKit on Windows, every `blob:` media source fails with `MEDIA_ERR_SRC_NOT_SUPPORTED` (error code 4), whatever the blob's MIME type, so `loadedmetadata` never fires. The same `.m4a` bytes served over HTTP from `/media/` load fine in the same browser (duration 76.6 s). Chromium reads the duration from the blob URL correctly.
- **Workaround.** None in the product: the panel shows "Length: unknown", says the file can't be played in the browser, and keeps Submit disabled, because the metadata schema needs a duration. The upload e2e test runs the whole flow (duration, submit, success state, notification) in Chromium, and in WebKit asserts the name, size and the "can't be played" state. Decision 19's full flow is not proven in WebKit by automated tests.
- **Affects.** Test coverage, and a decision for the lead about the slice. Real Safari and iOS play `blob:` media, but that needs a device check. Separately, any file the browser cannot decode (for example an iPhone HEVC `.mov` opened in Chrome on Windows) will hit the same "unknown duration, Submit disabled" state. The slice should decide whether to allow submitting without a browser-read duration and let the D21 media job measure it with ffprobe instead.
- **Evidence.** Playwright 1.63 WebKit on Windows 11: `file.type` `audio/x-m4a`, `canPlayType("audio/mp4")` `"probably"`, preview element `error.code` 4; fresh `<audio>` on `URL.createObjectURL(new Blob([bytes], { type: "audio/mp4" }))` and on an untyped blob both give error 4; `<audio src="/media/student-take-a.m4a">` gives `duration` 76.6.

## 9. Mantine `Badge` inside `Text` breaks hydration (React error #418)

- **What happened.** On `/student/progress`, a `Badge` sat inside a `Text`. `Text` renders a `<p>` and `Badge` renders a `<div>`. The browser's HTML parser closes the `<p>` before the `<div>`, so the server HTML no longer matches React's tree, and hydration fails with `Minified React error #418` in both Chromium and WebKit.
- **Workaround.** Use `Group` (a `<div>`) to lay out text and badges side by side. Keep block components (`Badge`, `Group`, `Stack`, `Card`) out of `Text` unless `Text` is given `component="div"` or `span`.
- **Affects.** The slice: any SSR page can hit this, and it only shows in the browser console. Not the founder demo now it is fixed.
- **Evidence.** Smoke test console on `/student/progress`: `Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]=`. Gone after replacing the `Text` with a `Group`.

## 10. WebKit logs a console error when a navigation aborts React Router's `/__manifest` fetch

- **What happened.** React Router 8 discovers routes lazily: when a page renders `<Link>`s, the browser fetches `/__manifest?paths=...` for them. If the page navigates away while that fetch is in flight (the smoke test's `page.goto` to the next width or route did this), WebKit logs two console errors: `Failed to fetch manifest patches TypeError: Load failed` and `... /__manifest?paths=%2Flibrary&version=... due to access control checks.` Chromium stays silent. Nothing breaks: the next page loads normally.
- **Workaround.** The e2e helpers let discovery finish before leaving a page: `settle()` in [helpers.ts](../apps/web/e2e/helpers.ts) waits 250 ms (discovery debounces its fetch by 100 ms), then until no `/__manifest` request is in flight. Waiting for `networkidle` was not enough: Playwright's load states are sticky, so it returned at once while a later fetch was still running. The "no console errors" check stays strict and the app is unchanged. Setting `routeDiscovery: { mode: "initial" }` in `react-router.config.ts` would remove the fetches by shipping the whole manifest up front; that is a choice for the slice, not made here.
- **Affects.** Test reliability only. Invisible to the founder in a normal demo.
- **Evidence.** WebKit (Playwright 1.63) console, `/demo` smoke test: `"Failed to fetch manifest patches TypeError: Load failed"`, `"/localhost:4173/__manifest?paths=%2F%2C%2Fdemo&version=f2431f43 due to access control checks."`. With `networkidle` alone, 2 of 34 runs still failed this way under the full suite. With the current `settle()`, the full suite passed twice (33 of 33, one skip) and once with `--repeat-each=3` (99 of 99).

## 11. The preview server once failed under a stressed e2e run (`fetch failed`, then 500s and refused connections)

- **What happened.** During one `pnpm test:e2e --repeat-each=3` run (12 Playwright workers, many media and aborted requests), the `vite preview` process logged `TypeError: fetch failed` from miniflare's `dispatchFetch`. Pages then got `500 (Internal Server Error)` responses, and later `net::ERR_CONNECTION_REFUSED` for `http://localhost:4173/student`, so the preview server had stopped. A second stressed run logged one `fetch failed` and no failed requests. After the test helpers stopped aborting page loads mid-flight (pitfall 10), a third stressed run (99 of 99) and two normal runs were clean. It has not been reproduced since, and the cause is not known.
- **Workaround.** None. Nothing in the app was changed for it.
- **Affects.** Local test reliability only, as far as is known: `vite preview` wraps the Worker in a Node proxy (the Cloudflare Vite plugin, miniflare), which production does not use. Worth knowing if the slice's CI runs e2e against `pnpm preview` with high parallelism.
- **Evidence.** `[WebServer] TypeError: fetch failed at Object.processResponse (undici@7.29.0 .../fetch/index.js:237:16) ... at async _Miniflare.dispatchFetch (miniflare@5.20260921.0-alpha .../index.js:119777:22)`; browser console `Failed to load resource: the server responded with a status of 500 (Internal Server Error)`; Playwright `page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4173/student`.
- **Stage 3b update: it now reproduces on every stressed run.** The suite grew to 50 tests (47 run, 3 skipped), with two review pages that each load a waveform, an upload panel and the library. Plain `pnpm test:e2e` passed 47 of 47 three times. Every `--repeat-each=2` run failed:
  - Run 1 (default workers): 93 passed, 1 failed. The preview server stopped: `page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4173/demo`.
  - Run 2: 92 passed, 2 failed. Two `[WebServer] TypeError: fetch failed` traces (the same undici `processResponse` to miniflare `dispatchFetch` stack as above, reached from `@cloudflare/vite-plugin@1.58.0 dist/index.mjs:51227`), then `500 (Internal Server Error)` on the landing page in WebKit and on "Send feedback" in Chromium.
  - Run 3: 91 passed, 3 failed, after three `fetch failed`.
  - Run 4 with `--workers=4`: four `fetch failed`, and at least four failures across unrelated specs (student feedback, upload, `/lab/player`, review).

  The failing tests are spread across old and new specs, and the review flow alone passed 30 of 30 (`review.spec --project chromium --repeat-each=10`), so no single route is the trigger. A comparison against the 3a commit was attempted in a scratch worktree, but its preview server would not start there (`ERR_PACKAGE_IMPORT_NOT_DEFINED: "#development-condition-enabled"` from `@react-router/dev`, an artefact of the scratch install), so whether 3a fails the same way under today's load is not proven. The cause is still unknown. This is reported to the lead rather than worked around: nothing in the app or the tests was changed for it.

## 12. A live clock that rounds the browser time down can run behind the server's time

- **What happened.** The review queue renders "Submitted 62 hours ago" on the server from the loader's request time, then follows a browser clock (`useSyncExternalStore`, journal decision 32). The first clock rounded `Date.now()` down to its 15-second tick, so repeated reads returned the same value. Right after hydration that rounded value could be up to 15 seconds *earlier* than the server's request time, and an item exactly 62 hours old re-rendered as "61 hours ago". There was no hydration error, because hydration itself used the server's time; the text just stepped backwards a moment later.
- **Workaround.** The clock now re-reads `Date.now()` at most once per tick and never rounds it ([useNow.ts](../apps/web/app/lib/useNow.ts)). The queue e2e test asserts the exact "Submitted 62 hours ago" text after hydration.
- **Affects.** The slice: any live countdown must start from a client time at or after the server's, and a browser clock that is behind the server's will still step backwards (only by its skew). Not the founder demo now it is fixed.
- **Evidence.** Playwright, Chromium: `Expected: "Submitted 62 hours ago"`, `Received: "Submitted 61 hours ago"` with the rounded clock; passes in Chromium and WebKit without rounding.
