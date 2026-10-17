# Waveform player

The shared media player from facade spec decisions 20 and 21. The student feedback view, the A/B compare and the coach review workspace all use it. [`/lab/player`](../../routes/lab.player.tsx) is its regression page.

## Public API

```tsx
// From a route module in app/routes/.
import { PlayerProvider, usePlayer, type PlayerHandle } from "../components/player/PlayerProvider";
import { WaveformPlayer } from "../components/player/WaveformPlayer";

<PlayerProvider>
  <WaveformPlayer
    asset={mediaAsset}
    comments={feedbackComments}
    label="Student take"
    ref={handleRef}
  />
  <AddCommentButton /> {/* calls usePlayer().handle.getCurrentTime() */}
</PlayerProvider>;
```

- **`PlayerProvider`** holds one player's state and its media element ref. Put exactly one `WaveformPlayer` inside each provider. Two players side by side need two providers.
- **`WaveformPlayer`** takes these props:
  - `asset: MediaAsset`
  - `comments?: readonly PlayerComment[]`, from `types.ts` (`Pick<FeedbackComment, "id" | "tSeconds" | "body">`, so unsent drafts fit too)
  - `label: string`, the accessible name
  - `height?: number`, in pixels (default 96)
  - `ref?: Ref<PlayerHandle>`

  It renders its own `<audio>` or `<video>`, depending on `asset.kind`. Keep the `comments` array stable, for example from loader data, because a new array redraws the markers.

- **`StandalonePlayer`** is a `PlayerProvider` holding one `WaveformPlayer`. It takes the same props, plus optional `children` rendered after the player inside the provider (for example a `CommentList`). Use it wherever only its own children need the player's context.
- **`usePlayer()`** returns `{ state, dispatch, handle }` from the nearest provider. It throws outside a provider.
- **`PlayerHandle`** has these methods:
  - `getCurrentTime()`: the exact position, read from the media element
  - `seek(sec)`
  - `play()`
  - `pause()`
  - `getMediaElement()`

  Use it for "add comment at current time", or to drive several players from one control (the A/B compare).

- **`state: PlayerState`** has these fields:
  - `isPlaying`
  - `currentTime`: throttled to at most 4 updates a second
  - `rate`: 0.5, 0.75 or 1
  - `loop: { enabled, region }`

  `dispatch` accepts these `PlayerEvent`s:
  - `play`
  - `pause`
  - `seek`
  - `setRate`
  - `setLoop`
  - `mediaTime`

  UI code only needs `setRate` and `setLoop`. The media element's own events dispatch `play`, `pause`, `seek` and `mediaTime`. To move the playhead, call `handle.seek`, not `dispatch({ type: "seek" })`.

## Behaviour

- wavesurfer.js 8 attaches to our media element through the `media` option. It draws the pre-computed peaks at `asset.peaksSrc` (`WaveformPeaksSchema` in `@singology/shared`, written by `jobs/media`), and never fetches or decodes the media file.
- wavesurfer, its Regions plugin and hls.js load with dynamic `import()` inside an effect, so SSR never touches `window`. Unmounting destroys wavesurfer and hls.js and resets the media element.
- The rate buttons set `playbackRate`, `defaultPlaybackRate` and `preservesPitch = true` on the media element.
- Dragging across the waveform creates the single loop region and turns looping on. The Loop switch toggles it. "Clear loop" removes it.
- Comments render as numbered markers (`data-testid="comment-marker"`). Clicking one seeks to its `tSeconds`.
- HLS: when `asset.hlsSrc` is set on a video, the player uses native HLS if `canPlayType("application/vnd.apple.mpegurl")` is truthy, else hls.js if Media Source Extensions exist, else the progressive `src`. The chosen path is exposed as `data-source-mode` on the media element: `native-hls`, `hls.js` or `progressive`.

## Known limits

- Seeking into unbuffered media needs a server that answers HTTP Range with `206`. Workers static assets ignore Range, so the facade serves `/media/*` through a Range-aware Worker handler ([serveMedia.ts](../../../workers/media/serveMedia.ts)). See pitfall 6 in [facade-pitfalls.md](../../../../../notes/facade-pitfalls.md).
