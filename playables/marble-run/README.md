# Marble Rush — 3D playable ad

A single-file interactive 3D ad creative: swipe to steer a marble down a track,
dodge four kinds of obstacle, collect gems, reach the finish. One source tree
builds one self-contained HTML file per ad network.

Built with **vanilla three.js** — no framework, no physics library, no assets.

## Numbers

| | |
|---|---|
| Built size | **504 KB**, **131 KB** gzipped |
| Google / Unity / AppLovin / ironSource limit | 5 MB → **9.8% used** |
| Mintegral limit | 3 MB → **16.4% used** |
| Meta limit (the tightest) | 2 MB → **24.6% used** |
| Asset bytes (textures, models, audio, fonts) | **0** |
| External requests at runtime | Google's hosted `exitapi.js` on that build only |
| Frame rate | 60 fps, with a one-shot resolution drop if a device can't hold it |
| Source | ~1600 lines |

Everything visible is generated in code: geometry from primitives, the marble's
shadow and the sky gradient from a `<canvas>`, the sounds from WebAudio
oscillators, the tutorial hand from CSS. That is the whole reason the file is
small — three.js itself is ~85% of the bundle.

## Run it

```bash
npm install
npm run dev            # http://localhost:5173 — arrow keys work for desktop testing
npm run build          # every network → dist/
npm run build unity meta   # just these two
```

`npm run build` prints a size table and drops one file per network in `dist/`.
Each file is complete: open it in a browser, or drop it into a network's
playable preview tool.

## How the networks are handled

Each network gets its own build. The adapter is chosen at build time
(`vite.config.js` replaces `__ADAPTER__`), so a Unity build never carries
Meta's code.

| Network | CTA call | Injected tag |
|---|---|---|
| Google Ads (App campaigns) | `ExitApi.exit()` | Google's hosted `exitapi.js` |
| Unity Ads | `mraid.open(url)` | `mraid.js` |
| AppLovin | `mraid.open(url)` | `mraid.js` |
| Mintegral | `install()`, brackets the run with `gameStart` / `gameEnd` | `mraid.js` |
| ironSource | `dapi.openStoreUrl()` | `dapi.js` |
| Meta | `FbPlayableAd.onCTAClick()` | — |
| preview | `window.open()` | — |

The game itself only ever calls `whenReady`, `openStore`, `reportStart` and
`reportEnd` from `src/ads.js`. Adding a network means one entry in
`networks.js` and one adapter object.

Every adapter falls back to plain browser behaviour when its SDK is missing, and
`whenReady` starts the game after 3 seconds whether or not the container's
`ready` event ever arrives. A dead ad is the worst possible outcome, so the
creative never waits on the container indefinitely.

`index.html` also declares a `clickTag` global. A playable clicks through MRAID,
not clickTag, but Google's HTML5 asset validator flags a creative without one —
and some ad servers rewrite it to their own tracking URL, so `ads.js` prefers it
over the built-in link when it is present.

The size limits in `networks.js` are the figures the networks commonly quote.
**Check the current spec before a real delivery** — they move.

### Google validation

The Google build passes Google's own H5 validator with **App campaigns**
checked: 23 checks, 0 errors.

Worth knowing, because it is the thing most easily got wrong: a playable in a
Google App campaign does **not** click through with MRAID. It loads Google's
hosted `exitapi.js` and calls `ExitApi.exit()` straight from the CTA handler.
Wrapping that call in `window.open` breaks the exit and reads as a "trick to
click" during review. The validator's Exit API check is also interactive — it
only turns green after the CTA is actually clicked inside its preview.

Google's own script is the one external URL in the build; it is allowlisted and
the validator's 4th-party-calls check passes with it in place.

## Testing it in a simulated ad container

The network SDKs are just JavaScript the ad player drops next to the creative,
so the whole container can be simulated locally — no advertiser account needed.

```bash
npm run build
npm run harness        # prints a LAN address and a QR code for your phone
```

Open the QR on a phone on the same Wi-Fi, pick a network and a failure mode. The
creative is served with a fake SDK beside it and an on-screen console showing
every SDK call, the frame rate, and any JavaScript error — which matters,
because a phone has no dev tools.

| Mode | What it simulates |
|---|---|
| Normal | SDK loads, `ready` fires at once |
| Slow SDK | `ready` arrives after 3 s |
| No ready | `ready` never fires — the watchdog in `ads.js` must start the game anyway |
| No SDK | the SDK script 404s — the creative must fall back to `window.open` |
| Broken CTA | the store call throws |

The last three are the point of the tool. A creative that waits forever for an
event the container never sends is a blank ad, and that is exactly the failure
no size check or linter will ever catch. `src/ads.js` starts the game after 3
seconds regardless, and every adapter has a browser fallback.

The mode lives in the URL path (`/play/never/google.html`) rather than a query
string, because the creative requests its SDK by relative path and a query
string would not reach that request.

Everything under `harness/` is a debug tool. None of it is in the build.

## Layout

```
index.html          canvas + DOM overlay (HUD, tutorial, endcard)
networks.js         one entry per network: limit, adapter, SDK tag
build.mjs           runs vite once per network, injects the SDK tag, reports sizes
publish-to-site.mjs copies the preview build into the portfolio's public folder
harness/            local ad-container simulator — debug only, never shipped
  server.mjs        serves the builds with a fake SDK beside them
  overlay.js        on-screen SDK log, FPS meter and error catcher
  sdk/              fake mraid.js, dapi.js and FbPlayableAd
src/
  main.js           boot
  game.js           state machine (ready → playing → over) and the frame loop
  scene.js          renderer, camera, lights, resize, quality guard
  level.js          track, obstacles, gems — all generated
  player.js         marble motion, rolling, camera follow
  juice.js          camera trauma, hit-stop, spark bursts
  collision.js      sphere vs oriented box — the entire physics engine
  input.js          relative swipe steering (+ arrow keys for desktop)
  ui.js             DOM overlay
  audio.js          synthesised sound
  ads.js            the only file that talks to a network
  config.js         every tuning number
```

## Design decisions worth knowing

- **Swipe steering is relative.** A drag moves the marble from where it already
  is, rather than snapping it under the finger. Absolute steering feels twitchy
  on a phone and forces the player to look at their thumb.
- **The marble cannot fall off.** It is clamped inside the rails, so the only
  fail state is hitting something. Falling off a ledge is a frustrating way to
  lose 3 seconds into an ad.
- **Every obstacle is solvable with one axis.** The spinner has a single arm, so
  it can never block both sides at once; gates always leave a lane. An ad that
  can be lost unfairly is an ad that gets closed.
- **Three lives, not one.** A run survives mistakes, which keeps the player in
  the loop long enough to reach the endcard.
- **The whole endcard is the CTA**, not just the button.
- **No shadow maps.** A canvas-drawn blob shadow under the marble costs a
  fraction of the frame time and looks the same at this art level.
- **Feedback is tiered, not sprinkled.** Every juicy event picks small / medium
  / large from `CONFIG.juice`, which is what keeps a gem pickup from shaking the
  screen as hard as a crash. Shake uses a decaying trauma value squared, so it
  always ends by itself; hit-stop feeds gameplay a zero delta while the loop
  keeps rendering. Details in the Game feel section of `AGENTS.md`.
- **Frame-rate independent motion** (`1 - Math.exp(-k * dt)`), and the delta is
  clamped at 50 ms so a backgrounded WebView can't teleport the marble through
  an obstacle on the frame it wakes up.

## Known cosmetic notes

The built file contains two harmless `http(s)://` strings that come from inside
three.js: the XHTML namespace constant and a paper citation in a GLSL comment.
Neither is a request. If a network's automated scan flags them, they can be
stripped with a small build-time replace.

## Campaign changes

- Store link, speeds, obstacle count, lives: `src/config.js`.
- Colours: `COLORS` in `src/level.js` and the CSS variables in `src/style.css`.
- Endcard copy: `finish()` in `src/game.js`.
