# Playable ad creatives

Two interactive 3D ads for mobile games, built with **vanilla three.js**. One
shared engine, one build pipeline, one creative per folder — and one
self-contained HTML file per ad network.

No framework, no physics engine, no asset files. Every shape, texture, label and
sound is generated in code.

| Creative | What it is | Built | Gzipped |
|---|---|--:|--:|
| **Marble Rush** | Swipe-steered runner: dodge four kinds of obstacle, collect gems | 503 KB | 131 KB |
| **Shelf Sort** | Tap-to-move sorting puzzle on a 3D rack | 503 KB | 131 KB |

Against the tightest limit of the six networks — Meta's 2 MB — that is **under
25%**. Against the 5 MB the others allow, under 10%.

## Run it

```bash
npm install
npm run build                       # 2 creatives × 7 targets = 14 files in dist/
npm run build marble-run            # one creative, every network
npm run build sort-3d unity meta    # one creative, two networks
npm run dev                         # first creative, or CREATIVE=sort-3d npm run dev
npm run harness                     # ad-container simulator, prints a QR code
npm run publish:site                # copy the preview builds into the games site
```

## Layout

```
creatives.js        the list of creatives — no directory scan
networks.js         one entry per network: limit, adapter, SDK tag
vite.config.js      parameterised by CREATIVE and NETWORK
build.mjs           runs vite once per pair, injects the SDK tag, reports sizes
publish-to-site.mjs copies the preview builds into ../games/public/playables/

shared/             the engine every creative uses
  ads.js            the only file that talks to an ad network
  juice.js          camera trauma, hit-stop, spark bursts
  collision.js      sphere vs oriented box — the whole physics engine
  input.js          relative swipe steering (+ arrow keys for desktop)
  textures.js       canvas-drawn textures, so nothing is ever loaded
  audio.js          synthesised sound

creatives/<id>/     index.html + src/: config, scene, level, game, ui, style
harness/            local ad-container simulator — debug only, never shipped
```

A creative owns its scene, its rules and its tuning. It never owns a network
adapter, a build step or a collision routine — those are shared, so a fix lands
in one place for both.

## One build per network

The adapter is chosen at build time, so a Unity build never carries Meta's code.

| Network | CTA call | Injected tag | Limit |
|---|---|---|--:|
| Google Ads (App campaigns) | `ExitApi.exit()` | Google's hosted `exitapi.js` | 5 MB |
| Unity Ads | `mraid.open(url)` | `mraid.js` | 5 MB |
| AppLovin | `mraid.open(url)` | `mraid.js` | 5 MB |
| ironSource | `dapi.openStoreUrl()` | `dapi.js` | 5 MB |
| Mintegral | `install()`, brackets the run with `gameStart` / `gameEnd` | `mraid.js` | 3 MB |
| Meta | `FbPlayableAd.onCTAClick()` | — | 2 MB |

Every adapter falls back to plain browser behaviour when its SDK is missing, and
`whenReady` starts the game after 3 seconds whether or not the container's
`ready` event ever arrives. A dead ad is the worst possible outcome, so the
creative never waits on the container indefinitely.

`build.mjs` exits non-zero if any build crosses its network's limit.

The limits in `networks.js` are the figures the networks currently quote.
**Check the spec before a real delivery** — they move.

### Google validation

The Google build passes Google's own H5 validator with **App campaigns**
checked: 23 checks, 0 errors.

Worth knowing, because it is the thing most easily got wrong: a playable in a
Google App campaign does **not** click through with MRAID. It loads Google's
hosted `exitapi.js` and calls `ExitApi.exit()` straight from the CTA handler.
Wrapping that call in `window.open` breaks the exit and reads as a "trick to
click" during review. The validator's Exit API check is also interactive — it
only turns green after the CTA is actually clicked inside its preview.

## Testing in a simulated ad container

The network SDKs are just JavaScript the ad player drops next to the creative,
so the whole container can be simulated locally — no advertiser account needed.

```bash
npm run build
npm run harness        # prints a LAN address and a QR code for your phone
```

Open the QR on a phone on the same Wi-Fi, pick a creative, a network and a
failure mode. The creative is served with a fake SDK beside it and an on-screen
console showing every SDK call, the frame rate, and any JavaScript error — which
matters, because a phone has no dev tools.

| Mode | What it simulates |
|---|---|
| Normal | SDK loads, `ready` fires at once |
| Slow SDK | `ready` arrives after 3 s |
| No ready | `ready` never fires — the watchdog in `ads.js` must start the game anyway |
| No SDK | the SDK script 404s — the creative must fall back to `window.open` |
| Broken CTA | the store call throws |

The last three are the point of the tool. A creative that waits forever for an
event the container never sends is a blank ad, and that is exactly the failure
no size check or linter will ever catch.

The mode lives in the URL path (`/play/never/sort-3d/google.html`) rather
than a query string, because the creative requests its SDK by relative path and
a query string would not reach that request.

Everything under `harness/` is a debug tool. None of it is in the build.

## Adding a creative

1. Copy the closest `creatives/<id>/` folder.
2. Add an entry to `creatives.js`.
3. Change `src/config.js` — store link, tuning, feedback tiers.
4. `npm run build <id>` and check the size table.
5. Play it through `npm run harness` on a real phone.

## Changing a campaign

Store link, speeds, lives, board layout: `creatives/<id>/src/config.js`.
Palette: the `COLORS` block in that creative plus its `style.css`.
Endcard copy: `finish()` in its `game.js`.
A new network: one entry in `networks.js`, one adapter in `shared/ads.js`.
