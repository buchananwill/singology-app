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

## 11. Windows: `vite preview`'s Node proxy exhausts ephemeral ports under stressed e2e runs (`fetch failed`, then 500s and refused connections)

- **What happened.** During one `pnpm test:e2e --repeat-each=3` run (12 Playwright workers, many media and aborted requests), the `vite preview` process logged `TypeError: fetch failed` from miniflare's `dispatchFetch`. Pages then got `500 (Internal Server Error)` responses, and later `net::ERR_CONNECTION_REFUSED` for `http://localhost:4173/student`, so the preview server had stopped. A second stressed run logged one `fetch failed` and no failed requests. After the test helpers stopped aborting page loads mid-flight (pitfall 10), a third stressed run (99 of 99) and two normal runs were clean. It has not been reproduced since, and the cause is not known.
- **Workaround.** Playwright's `webServer` now builds and serves the built Worker with `wrangler dev` (local, straight from workerd) instead of `pnpm preview` (commit `b40f0be`, [playwright.config.ts](../apps/web/playwright.config.ts)). Nothing in the app changed. `pnpm preview` is still there for people. This departs from spec decision 25's "against `pnpm preview`"; both run the same built Worker in workerd.
- **Affects.** Local test reliability on Windows only. Not production, not the founder demo, not the slice's runtime: production has no Node proxy in front of the Worker. It matters only if the slice's CI runs many e2e requests through `vite preview` on Windows.
- **Evidence.** `[WebServer] TypeError: fetch failed at Object.processResponse (undici@7.29.0 .../fetch/index.js:237:16) ... at async _Miniflare.dispatchFetch (miniflare@5.20260921.0-alpha .../index.js:119777:22)`; browser console `Failed to load resource: the server responded with a status of 500 (Internal Server Error)`; Playwright `page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4173/student`.
- **Stage 3b update: it now reproduces on every stressed run.** The suite grew to 50 tests (47 run, 3 skipped), with two review pages that each load a waveform, an upload panel and the library. Plain `pnpm test:e2e` passed 47 of 47 three times. Every `--repeat-each=2` run failed:
  - Run 1 (default workers): 93 passed, 1 failed. The preview server stopped: `page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4173/demo`.
  - Run 2: 92 passed, 2 failed. Two `[WebServer] TypeError: fetch failed` traces (the same undici `processResponse` to miniflare `dispatchFetch` stack as above, reached from `@cloudflare/vite-plugin@1.58.0 dist/index.mjs:51227`), then `500 (Internal Server Error)` on the landing page in WebKit and on "Send feedback" in Chromium.
  - Run 3: 91 passed, 3 failed, after three `fetch failed`.
  - Run 4 with `--workers=4`: four `fetch failed`, and at least four failures across unrelated specs (student feedback, upload, `/lab/player`, review).

  The failing tests are spread across old and new specs, and the review flow alone passed 30 of 30 (`review.spec --project chromium --repeat-each=10`), so no single route is the trigger. A comparison against the 3a commit was attempted in a scratch worktree, but its preview server would not start there (`ERR_PACKAGE_IMPORT_NOT_DEFINED: "#development-condition-enabled"` from `@react-router/dev`, an artefact of the scratch install), so whether 3a fails the same way under today's load is not proven. The cause is still unknown. This is reported to the lead rather than worked around: nothing in the app or the tests was changed for it.
- **Diagnosis: the cause is the local proxy, not our code (classification B).**
  - **The real error.** With the vite plugin's request handler temporarily patched in `node_modules` to log `error.cause` (reverted afterwards), every `fetch failed` in a failing run was `connect EADDRINUSE 127.0.0.1:<workerd port>`: Node could not open a new TCP connection to workerd. 15 of 15 in one run, 1 of 1 in another. The failing URLs were mostly `/assets/*.js` chunks, plus `/student` and `/__manifest`, none of them media. No workerd crash was logged.
  - **The mechanism.** `vite preview` opens a new loopback TCP connection to workerd for every request, and the Node side closes it, leaving it in `TIME_WAIT`. 200 sequential, fully read requests left exactly 200 new `TIME_WAIT` sockets to the workerd port, for each of `/assets/<chunk>.js`, `/`, `/media/coach-reply.m4a` and a Range request to it. `/assets/*` is served by the static-assets handler and never reaches our Worker, so neither `serveMedia` nor React Router is involved. After one stressed run, 5,844 `TIME_WAIT` sockets pointed at that run's workerd port. Windows has 16,384 ephemeral ports (49152 to 65535, `netsh int ipv4 show dynamicport tcp`), and `TcpTimedWaitDelay` is unset (Windows default). So back-to-back runs pile up sockets until connects fail. Why the proxy does not reuse connections is unproven: miniflare's runtime dispatcher is an undici `Pool` with default keep-alive, and stopping the plugin from aborting the request on `res` `close` did not change the count.
  - **Why it looked random.** It depends on how many sockets are still in `TIME_WAIT` from the current and earlier runs, so it is intermittent rather than every run. In this diagnosis, six stressed runs spread over about 20 minutes had no `fetch failed` (four passed 94 of 94; a `--repeat-each=4` run and a `--workers=16` run each had one unrelated timing failure). Then four strictly back-to-back `--repeat-each=2` runs gave 94, 94, 93 (1 failed, 1 `fetch failed`) and 78 passed (16 failed, 15 `fetch failed`, 11 page 500s, 2 `ERR_CONNECTION_REFUSED`). Limiting workers does not help: the run makes the same number of connections, and the stage 3b run with `--workers=4` still failed.
  - **Without the proxy.** `wrangler dev --config build/server/wrangler.json` serves the same built Worker from workerd directly. The same 200-request probes left 0 new `TIME_WAIT` sockets (8 for the Range probe). Four back-to-back stressed runs against it passed 94 of 94 each, with no `fetch failed`, 500s or refused connections. A direct load test through `vite preview` (up to 256 concurrent mixed requests: SSR, media with and without Range, slow readers, mid-body aborts) had 0 failures, which fits: the trigger is the total number of connections in the `TIME_WAIT` window, not concurrency or slow media.
  - **Not run, and why.** The throttled-seek exclusion and the `44b7678` worktree comparison were skipped: the failing requests were JS chunks served without our Worker, and the one-connection-per-request behaviour shows on `/assets/*`, which the media route does not touch. The `ERR_CONNECTION_REFUSED` from the browser to port 4173 appeared only in the most exhausted run; that it is the same port exhaustion (rather than the preview server exiting) is likely but unproven.
  - **Resolution.** e2e runs against `wrangler dev` (commit `b40f0be`). After the change, three back-to-back stressed runs passed 94 of 94 (6 skipped) each, and plain `pnpm test:e2e` passed 47 of 47 (3 skipped). No `workerd.exe` was left running afterwards.
  - **In plain English:** this is a Windows local-testing problem in Cloudflare's Vite preview proxy; it does not affect production, the founder demo or the slice.

## 12. A live clock that rounds the browser time down can run behind the server's time

- **What happened.** The review queue renders "Submitted 62 hours ago" on the server from the loader's request time, then follows a browser clock (`useSyncExternalStore`, journal decision 32). The first clock rounded `Date.now()` down to its 15-second tick, so repeated reads returned the same value. Right after hydration that rounded value could be up to 15 seconds *earlier* than the server's request time, and an item exactly 62 hours old re-rendered as "61 hours ago". There was no hydration error, because hydration itself used the server's time; the text just stepped backwards a moment later.
- **Workaround.** The clock now re-reads `Date.now()` at most once per tick and never rounds it ([useNow.ts](../apps/web/app/lib/useNow.ts)). The queue e2e test asserts the exact "Submitted 62 hours ago" text after hydration.
- **Affects.** The slice: any live countdown must start from a client time at or after the server's, and a browser clock that is behind the server's will still step backwards (only by its skew). Not the founder demo now it is fixed.
- **Evidence.** Playwright, Chromium: `Expected: "Submitted 62 hours ago"`, `Received: "Submitted 61 hours ago"` with the rounded clock; passes in Chromium and WebKit without rounding.

## 13. The client bundle has chunks over 500 kB

- **What happened.** `pnpm build` warns that "Some chunks are larger than 500 kB after minification". The likely contributors are Mantine, wavesurfer.js and hls.js loaded where they aren't needed; which chunk and why is **not yet measured**.
- **Workaround.** None in the facade; it works, and the founder will view it on good connections.
- **Affects.** The slice: students use phones, often on mobile data, and first-load weight matters for a weekly habit. Before the beta, measure the chunks (a bundle visualiser), lazy-load the player (wavesurfer.js and hls.js) only on routes that render it, and check that Mantine is tree-shaken. Not the founder demo.
- **Evidence.** The build output during the lead's `pnpm test:e2e` run on 2026-09-24, from the Vite reporter (`[plugin builtin:vite-reporter] (!) Some chunks are larger than 500 kB after minification`).

## 14. `isbot` is not dead code: React Router's default server entry needs it

- **What happened.** Review-fix item W3.10 (S-B18) said to remove `isbot` from `apps/web/package.json`, since no app code imports it. But the app has no `app/entry.server.tsx`, so React Router uses its default `entry.server.web.tsx`, which does `import { isbot } from "isbot"`. When the dependency is missing, `@react-router/dev` adds `isbot@^5` back to `package.json` and runs `pnpm install` by itself.
- **Workaround.** Not removed. The sub-item is skipped and reported to the lead. Removing it would only make sense with a custom `entry.server.tsx` that does not use it.
- **Affects.** Neither the slice nor the founder demo. The review finding was wrong.
- **Evidence.** `node_modules/@react-router/dev/dist/config/defaults/entry.server.web.tsx:3` imports `isbot`; `@react-router/dev` 8.4.0 `typegen-*.js:449-457` (`if (!deps["isbot"]) { console.log("adding \`isbot@5\` to your package.json ...") ... execSync("pnpm install") }`).

## 15. The S2 spike could not connect: the `DATABASE_URL` tenant does not exist

- **What happened.** The first S2 spike (`packages/db/scripts/spikeRlsClaims.ts`) failed at connect, before any statement ran. The `DATABASE_URL` in `packages/db/.env` names port 6543 (the transaction pooler), where schema decisions 58 and 77 require the session pooler on 5432. On every combination of `aws-0`/`aws-1-eu-west-2.pooler.supabase.com` and ports 5432/6543, Supavisor answered `(ENOTFOUND) tenant/user postgres.<ref> not found`. The project's own hostname `<ref>.supabase.co` does not resolve ("DNS name does not exist"), while the pooler hostname does, so the project ref in the env file does not name a live Supabase project.
- **Workaround.** None. The env file is the user's; it was not edited or worked around. The lead was told, and the database-independent parts of S2 went ahead.
- **Affects.** The slice: every database step of S2 (spike, `db push`, seed, pgTAP, integration tests, `/lab/db`) waits on a correct session-pooler string. Not the founder demo.
- **Resolution.** The repo's `packages/db/.env` was correct all along. The stale string came from an inherited system `DATABASE_URL` (pitfall 18). With the file winning, the spike passes.
- **Evidence.** `scripts/describeDatabaseUrl.ts` (password redacted): `postgresql://postgres.nagpxhvdhstzqpdqqkmp:REDACTED@aws-1-eu-west-2.pooler.supabase.com:6543/postgres`; `pg` error `code: 'XX000'`, `severity: 'FATAL'`, `(ENOTFOUND) tenant/user postgres.nagpxhvdhstzqpdqqkmp not found`; `Resolve-DnsName nagpxhvdhstzqpdqqkmp.supabase.co` → `DNS_ERROR_RCODE_NAME_ERROR`.

## 16. The seed needs a fourth secret: schema decisions 73 and 77 conflict

- **What happened.** Decision 73 says the seed creates the alpha users "with `adminDb` and the Supabase admin auth API". That API (`auth.admin.createUser`) authenticates with the project's secret (service-role) API key. Decision 77 says the secrets are "three keys and no more", and none of the three is that key. The only route inside three keys is inserting into `auth.users` with SQL, which is not the admin auth API and writes to a table Supabase owns.
- **Workaround.** None taken. `src/seed/seedAlpha.ts` follows decision 73 and reads a fourth key, `SUPABASE_SECRET_KEY`, from `packages/db/.env`; the project URL is derived from the pooler user name, so no other key is added. It has not run (pitfall 15 blocks every database step anyway). The lead rules on whether 77 gains the key or 73 changes.
- **Affects.** The slice (the seed, and with it the integration and pgTAP tests that need the alpha users). Not the founder demo.
- **Resolution.** The lead ruled for the key: decision 77 becomes `DATABASE_URL`, `SUPABASE_SECRET_KEY` and the wrangler Hyperdrive local string (`SUPABASE_DB_PASSWORD` is retired; the CLI uses `--db-url`). With the key in place, the seed ran twice with identical row counts.
- **Evidence.** Spec decisions 73 and 77; `@supabase/supabase-js` 2.118 `auth.admin.createUser` is documented as requiring the secret or `service_role` key.

## 17. `supabase test db --linked` needs Docker, so pgTAP runs through a Node runner

- **What happened.** Decision 76 asks the implementer to check whether `supabase test db --linked` runs on Windows without a local stack. It does not: the CLI connects to the database first, then runs `pg_prove` from the Docker image `supabase/pg_prove:3.36`, which is named in the CLI binary. This machine has no Docker.
- **Workaround.** This is decision 76's own fallback. `packages/db/scripts/runRlsTests.ts` (`pnpm --filter @singology/db test:rls`) runs each `supabase/tests/*.sql` over `DATABASE_URL` in one transaction: `supabase/tests/support/setup.sql` first, then the file, then a rollback. It parses the TAP rows and fails on any `not ok`, an error, or a count that does not match the plan. `--mutate` runs each file again with its policy loosened or dropped inside the same rolled-back transaction, and requires that run to fail. The files have no `begin`/`rollback` of their own, so they run only through this runner, not through `pg_prove`.
- **Affects.** The slice's test tooling only. Not the founder demo.
- **Evidence.** `pnpm exec supabase test db --db-url postgresql://postgres:dummy@127.0.0.1:1/postgres` → `Connecting to remote database...` then `DbConnectError` (it connects before anything else); `grep -a` over `@supabase/cli-windows-x64@2.121.0/bin/supabase-go.exe` finds `supabase/pg_prove:3.36`.

## 18. An inherited system `DATABASE_URL` shadowed `packages/db/.env`

- **What happened.** An old system-level `DATABASE_URL` from another project was still in the environment that agent shells inherit, even after the user had deleted it. Node's `process.loadEnvFile` and `--env-file` never override a variable that is already set, so the db scripts connected with the stale string (pitfall 15) and ignored the correct repo file.
- **Workaround.** `packages/db/src/seed/env.ts` parses `packages/db/.env` with `util.parseEnv` and assigns it over `process.env`, so the file wins and the environment is used only for keys the file does not set. Every db script, the seed, the tests and the Supabase CLI wrapper (`pnpm --filter @singology/db supabase ...`) load through it.
- **Affects.** The slice's local tooling. Not the founder demo, and not the Worker, which reads `.dev.vars` or the Hyperdrive binding.
- **Evidence.** `scripts/listEnvKeys.ts`: `file keys: DATABASE_URL, SUPABASE_DB_PASSWORD`, `inherited: DATABASE_URL`. After the fix, `scripts/describeDatabaseUrl.ts` prints `host=aws-0-eu-west-1.pooler.supabase.com port=5432 ref=hfiefxdyomlpxzjiedwi`, and the spike prints `auth.uid() round-trips: true`.

## 19. `/lab/db` does not render locally: local Hyperdrive breaks on an encoded password

- **What happened.** Two problems, one after the other.
  - **The variable is not read from `.dev.vars`.** Decision 77 puts `WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` in `apps/web/.dev.vars` for `wrangler dev` to substitute. Neither `pnpm dev` (the Vite plugin) nor `wrangler dev` on the built Worker reads it from there. Both stop with "you should use a local Postgres connection string to emulate Hyperdrive ... set the value of the 'CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE' variable". They want a process environment variable (and `wrangler types` declares the `.dev.vars` key as an ordinary string var instead).
  - **The local connection string cannot be parsed.** With the value passed as `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` (a scratch launcher, not committed), the Worker starts. But `GET /lab/db` returns 500 with `TypeError: Invalid URL string` from `pg`'s `ConnectionParameters`. A boolean-only diagnostic shows `env.HYPERDRIVE.connectionString` does not parse as a URL, and `env.HYPERDRIVE.password` contains URL-reserved characters. The source string in `.dev.vars` parses and its password is percent-encoded. So local Hyperdrive decodes the password and rebuilds `connectionString` without encoding it again.
- **Workaround.** None taken: `createUserDb(connectionString, claims)` is the spec's signature, and building the client from `env.HYPERDRIVE.host`, `user`, `password` and so on would change it. Possible rulings: give the database a password made only of unreserved characters (letters, digits, `-._~`); or have `createUserDb` accept Hyperdrive's discrete fields; or wait for a Wrangler fix. The deployed Worker was not tried (no deploys from agents).
- **Affects.** The slice: local `/lab/db`, and from S3 every local request through `HYPERDRIVE`. Not the founder demo. The same Worker path is proven over `pg` from Node (spike, test:db).
- **Resolution.** The lead's rulings:
  - **The variable (19a).** The key in `apps/web/.dev.vars` is renamed to `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`. The `dev` script and the Playwright `webServer` command start their tool with `node --env-file-if-exists=.dev.vars`, so it reaches the process environment. A fresh clone without `.dev.vars` cannot start either server, because the `HYPERDRIVE` binding needs a local string.
  - **The encoding (19b).** `createUserDb` and `createAdminDb` take `ConnectionSettings` (`host`, `port`, `user`, `password`, `database`). The Worker passes `env.HYPERDRIVE` straight through and never parses a URL; Node callers use `connectionSettingsFromUrl(DATABASE_URL)`.
  - **Result.** `GET /lab/db` returns 200 and renders "Active coaches: 2", both under `pnpm dev` and under `wrangler dev` on the built Worker. `pnpm test:e2e` passes 47 (3 skipped).
- **Evidence.** `wrangler 4.137.0` `[ERROR] When developing locally, you should use a local Postgres connection string ...`; with the variable set, `[ERROR] TypeError: Invalid URL string. at parse ... at new ConnectionParameters ... at new Client ... at countActiveCoaches ... at loader`, `GET /lab/db 500`; diagnostic `parses=false pwReserved=true`, and for `.dev.vars` `parses=true passwordHasPercentEncoding=true`.

## 20. Anonymous visitors cannot read coach display names

- **What happened.** `Coach.displayName` comes from `profiles`. Decision 44 grants `anon` only `coaches` and `coach_offers`, and decision 45 lets an authenticated user see a profile only when it is their own or on the other side of one of their enrolments. So `coaches.listWithOffers()` (an inner join to `profiles`) returns no rows as `anon`, and only partial rows for a signed-in user who is not enrolled with every coach. The landing page's coach cards need the names.
- **Workaround.** None. The repository follows the spec; `/lab/db` counts coaches without names, so it is unaffected. A likely ruling is one more `profiles` select policy, for `anon` and `authenticated`, on profiles whose `coaches` row is `active`.
- **Affects.** The slice from S3, when the landing page moves to Drizzle. Not the founder demo, which runs on fixtures.
- **Resolution.** The lead's ruling: a `profiles_select_active_coach` policy for `anon` and `authenticated` on profiles whose `coaches` row is active. It ships as an additive drizzle-kit migration, plus a custom one that grants `anon` select on `profiles`, since the policy needs the grant. pgTAP `profiles.sql` asserts that anon sees exactly the active coaches' profiles, and loosening the policy convicts it. As anon, `coaches.listWithOffers()` now returns both alpha coaches with their names (test:db).
- **Evidence.** Spec decisions 44, 45 and 62; `createDrizzleRepositories.ts` `listWithOffers` joins `profiles`; pgTAP `profiles.sql` asserts `anon` gets `permission denied for table profiles`.

## 21. The e2e server inherited the stale system `DATABASE_URL` again

- **What happened.** The first e2e server launcher ran `node --env-file=../../packages/db/.env.test`. As in pitfall 18, `--env-file` never overrides a variable that is already set, so the Worker's local Hyperdrive string came from the inherited system `DATABASE_URL`, and every request failed with `(ENOTFOUND) tenant/user postgres.nagpxhvdhstzqpdqqkmp not found`. The suite timed out waiting for the web server.
- **Workaround.** `apps/web/scripts/serveTestWorker.ts` parses `packages/db/.env.test` with `util.parseEnv` and passes the values explicitly: `DATABASE_URL` as `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` in the child's environment, and `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as `wrangler dev --var` overrides.
- **Affects.** The slice's e2e tooling. A system-level `DATABASE_URL` for ref `nagpxhvdhstzqpdqqkmp` still exists on this machine; the user may want to delete it at the system level.
- **Evidence.** `[WebServer] ✘ [ERROR] error: (ENOTFOUND) tenant/user postgres.nagpxhvdhstzqpdqqkmp not found`; after the fix, both testers sign in through `/auth/confirm` and the test-project sessions read their own roles, which only works when the Worker's database is the test project.

## 22. Parallel e2e workers exhaust the Supabase session pooler under local Hyperdrive

- **What happened.** With the app on Drizzle, the first green-path run failed six tests with `(EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15`. Local Hyperdrive emulation does not pool: every `createUserDb` call (one per repository method) opens its own connection, loaders fan out with `Promise.all`, and Playwright's default worker count multiplies that.
- **Workaround.** `workers: 2` in `apps/web/playwright.config.ts`. The suite then runs green in about two minutes.
- **Affects.** Local e2e and, under heavy parallel use, `pnpm dev`. Not the deployed Worker, where Hyperdrive pools connections in front of the session pooler. Worth watching in S7 if the alpha ever opens more than a few tabs at once.
- **Evidence.** Before: `6 failed, 57 passed` with `EMAXCONNSESSION` lines from the web server. After: `63 passed, 3 skipped`.

## 23. Slice-auth decision 27's 403 case needs a student-only tester, and the cast has none who signs in

- **What happened.** Decision 27 asks for "a student is refused the coach queue with 403". Decision 18 makes the CTO both `student-ada` and `coach-standard`, and `signInAs` signs in only the founder or the CTO (decision 24). The students who hold only a student row (`student-ben`, `student-cara`, `student-dev`) have placeholder addresses and never sign in. So no tester can be a student refused the queue.
- **Workaround.** None for the case as written. The suite checks the mirror instead: the founder, who coaches and is not a student, is refused `/student` with a 403. That runs the same guard path (`requireStudent` beside `requireCoach`, one helper).
- **Affects.** The slice's e2e coverage of `requireCoach`'s 403 branch. A ruling could add a student-only tester to `signInAs` (for example `student-ben`'s placeholder user, which the admin API can sign in without email).
- **Evidence.** `apps/web/e2e/smoke.spec.ts`, "the header shows the coach role, and the student pages are refused with 403".
- **Resolution.** The lead's ruling: a third tester, `ben` (the seeded `student-ben`, student only), joins `ALPHA_TESTERS` in `alphaCast.ts`. The setup project signs him in, and "a student is refused the coach queue with 403" runs as decision 27 says. The founder-refused-`/student` mirror stays.

## 24. Slice-feedback decision 9's "exercises assigned by this feedback" has no read path

- **What happened.** Decision 9 asks `ReviewedView` to show the exercises assigned by the sent feedback, "by `assignments.feedback_id`". The column exists and `feedback.send` writes it, but nothing reads it. `Assignment` in `packages/shared` has no `feedbackId`, `toAssignment` drops the column, and the only assignment query is `assignments.forStudent`. The roster says `packages/db` is unchanged and journal decision 60 says S5 adds no repository method, so the decision cannot be met as written.
- **Workaround.** None. `ReviewedView` shows the take with the persisted comments, the summary, the sent date and the link back to the queue, and has no assignments section. Matching on `assignedAt === sentAt` (both are `now()` in the one transaction) would work, but it is a guess, not the column the decision names.
- **Affects.** The coach's reviewed face only. The student side is unaffected: the new exercise shows under "Next exercises" and on "This week".
- **Possible ruling.** Add `feedbackId: IdSchema.optional()` to `AssignmentSchema`, map it in `toAssignment` and in the fixture data. Then the loader filters `assignments.forStudent(enrolment.studentId)` by `feedbackId` (the coach's select policy already covers those rows) and resolves the titles with `library.getMany`. That is one optional field and one mapper line, with no new method and no migration.
- **Evidence.** `packages/shared/src/schemas.ts` `AssignmentSchema`; `packages/db/src/drizzle/mappers.ts` `toAssignment`; `packages/db/src/repositories.ts` `AssignmentRepository`.
- **Resolution.** The lead adopted the suggested ruling. `AssignmentSchema` gains `feedbackId: IdSchema.optional()`. `toAssignment` maps the column, and the fixture `feedback.send` sets it on the assignments it creates. In reviewed mode the review loader filters `assignments.forStudent(enrolment.studentId)` by `feedbackId === feedback.id` and resolves the titles with `library.getMany`. `ReviewedView` lists them under "Exercises assigned". There is no migration and no new method. The mapper unit test, the fixture send test and `test:db` (21 passed) assert the field. The e2e asserts "Hum into a vowel · Onset" on the reviewed face.

## 25. Slice-feedback decision 16's "`/student` shows the assignment as `feedback_ready`" fails on the four-item home

- **What happened.** After the founder reviews `sub-ada-onset`, its assignment (`asg-ada-onset`, "Balanced onsets on 'ah'") becomes `feedback_ready`. But `/student` lists only the four most recent assignments (`THIS_WEEK_LIMIT`). The new exercise takes the top place, and `asg-ada-onset` ties with `asg-ada-siren-2` at nine days ago with the same `created_at`, so it drops off the list. The run showed "Hum into a vowel", "Five-note runs", "Sustained hiss" and "Siren slides" (feedback ready). Decision 12 says the home changes no query.
- **Workaround.** None for the case as written. The e2e asserts what `/student` does show after the send: the new exercise first on "This week", and the latest-feedback card for "Balanced onsets on 'ah'" with 2 timestamped comments. The `feedback_ready` assertion is left out.
- **Affects.** Decision 16's last student-side check only.
- **Possible ruling.** Seed `asg-ada-onset` later than `asg-ada-siren-2` (for example `-8 * DAY`), so it holds a place in the four. Or assert the status on `/student/exercises/<onset>`, whose badge reads the latest assignment of that exercise. Or raise the limit.
- **Evidence.** `apps/web/app/routes/student.home.tsx` `THIS_WEEK_LIMIT = 4`; `packages/db/src/fixtures/data.ts` assignments; the failed run's page snapshot of `/student`.
- **Resolution.** The lead's ruling: `asg-ada-onset` is seeded at `-8 * DAY`, so it no longer ties with `asg-ada-siren-2` and keeps its place in the four. The decision-16 check is restored, and after the send `/student` shows "Balanced onsets on 'ah'" as "Feedback ready". The two extra assertions stay: the new exercise first, and the latest-feedback card. `pnpm test:e2e`: 67 passed, 3 skipped.

## 26. Slice-nudges decision 16's subjects need data that the declared `DueNotification` does not carry

- **What happened.** Decision 16 fixes the subjects "{Coach first name} has feedback on your {exercise title}" and "{Student first name} sent a take: {exercise title}". The roster's `DueNotification` has `email` and `displayName`, which decision 10 pairs as the recipient's. It has no field for the other person's name or the exercise title. Decision 10 also says the sender needs no second lookup, and the templates are pure.
- **Workaround.** An additive field, `about?: { displayName: string; exerciseTitle: string }`. It holds the coach or student and the library item title, and both event queries fill it from the same joins. `displayName` stays the recipient's, so each email opens "Hi {first name},". The reminder leaves `about` unset. A feedback-ready or new-submission template given no `about` throws, so the row counts as failed and is never claimed.
- **Affects.** The roster declaration of `DueNotification` in `packages/db/src/notificationQueue.ts`, which now differs from the spec by one optional field.
- **Possible ruling.** Adopt `about` into the roster as it is. Or make `DueNotification` a union on `kind` so the field is required where it is used.
- **Evidence.** `notes/slice-nudges.md` §1 and decisions 10 and 16; `apps/web/workers/notifications/templates.ts`; `packages/db/test/db/notificationQueue.test.ts` asserts `about` on the seeded rows.
- **Resolution.** The lead's ruling: `DueNotification` is a union on `kind`, with no optional `about`. Every arm carries `recipient: Recipient` (`{ userId, email, displayName }`). The arms are `FeedbackReadyDue` (`coachFirstName`, `exerciseTitle`, `submissionId`), `NewSubmissionDue` (`studentFirstName`, `exerciseTitle`, `submissionId`) and `PracticeReminderDue` (`waitingCount`, `periodStart`). `FeedbackReadyDue` also carries `feedbackId`, because decision 7 claims on `entity_id = feedback.id` and the ruling's arm had no field for it. Each template takes its own arm, and `nudgeEmail` switches on `kind`, so the wrong arm does not compile. The queue builds the first names with `firstName`, which moved to `packages/shared` so that `packages/db` can use it. The reminder's `link.exerciseIds` is replaced by `waitingCount`, counted in the query. A bounce guard came with the ruling: the queue skips any address at `PLACEHOLDER_EMAIL_DOMAIN`, which `placeholderEmail` also uses. `test:db`: 33 passed.

## 27. Slice-nudges decisions 12 and 13 need the notification id inside `EmailTransport.send`

- **What happened.** The roster declares `send(message: EmailMessage)`. Decision 12 sends the claimed notification's id as Resend's `Idempotency-Key`, and decision 13 makes the dry-run id `dry-run:<notification id>`. `EmailMessage` (`to`, `subject`, `text`, `html`) does not carry that id.
- **Workaround.** `send(message, idempotencyKey)`. `runNudges` passes the claim's id. `EmailMessageSchema` stays as the roster declares it.
- **Affects.** The transport signature in `apps/web/workers/notifications/transport.ts` only.
- **Evidence.** `runNudges.test.ts` checks the Resend request's `Idempotency-Key` and the dry-run id.
- **Resolution.** The lead adopted `send(message, idempotencyKey)` as the transport signature and is amending the spec roster.

## 28. `@singology/db/admin` crashed the Worker at start-up: `new URL("../", import.meta.url)` at module scope

- **What happened.** S6 is the first Worker code to import `@singology/db/admin`. `env.ts` computed its package directory at module scope. In the bundled Worker that line runs at load, and workerd has no file URL there. The built Worker failed under `wrangler dev` with `Uncaught TypeError: Invalid URL string. at index.js:1149:1`, so every route, not just the scheduled handler, would have been down.
- **Workaround.** The URL is now resolved inside `requireEnv` on first use. The Worker never calls it, since it reads `env.HYPERDRIVE`. Node scripts and tests behave as before.
- **Affects.** Any future Worker import of `@singology/db/admin`, such as the webhook routes. Keep that entry free of module-scope Node-only work.
- **Evidence.** The failed `serve:built:test` start log. After the fix the server starts, and `GET /cdn-cgi/local/scheduled?cron=*/5+*+*+*+*` returns 200 and logs `nudges {"cron":"*/5 * * * *","due":5,"sent":5,...}`.
- **Resolution.** The lead accepted the fix. `packages/db/src/admin.test.ts` loads the entry with `SINGOLOGY_ENV` set to an invalid value and records any call to `existsSync`, `readFileSync`, Supabase's `createClient`, `pg.Pool` or `new URL(…, file:…)`. It fails when the old module-scope URL is put back. Writing the test also caught a load-order bug: `E2E_EMAILS` calls `placeholderEmail` at load, before `PLACEHOLDER_EMAIL_DOMAIN` was initialised, so the constant moved to the top of `alphaCast.ts`.

## 29. A Drizzle select builder generic over its fields loses `innerJoin` after the first join

- **What happened.** For `recentlyReviewedForCoach` the coach queue's four joins were to become one builder, `coachSubmissionsSelect<TFields extends SelectedFields>(tx, fields)`, so that the queue and the reviewed list each add their own filter, order and joins. `tsc` rejects it: `Property 'innerJoin' does not exist` on the builder's own second join. Calling `.$dynamic()` straight after `.from()` does not help. Drizzle's join result types do not resolve while the selection is still a type parameter.
- **Workaround.** Each query writes its own select and join chain. They share the `queueFields` selection and a `toQueueItems` helper that loads the library items and maps rows to `CoachQueueItem`.
- **Affects.** Any future attempt to share a join chain across selections in `packages/db/src/drizzle/`. The slice and the demo are unaffected.
- **Evidence.** `pnpm --filter @singology/db typecheck` on the builder version: `src/drizzle/submissions.ts(64,6): error TS2339`.
- **Resolution.** Accepted. The two queries in `packages/db/src/drizzle/submissions.ts` repeat four `innerJoin` lines. Drizzle 0.45's `PgSelectJoin` is a deferred conditional while the selection is a type parameter, so no type-safe shared join chain exists for two differing selections, and the alternatives add a concept to remove four lines.
