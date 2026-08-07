# Working rules for this creative

Constraints for anyone — human or AI agent — changing this playable. They exist
because a creative is rejected for things a linter never sees: a stray network
request, a file over the limit, a frame rate a cheap Android can't hold.

Read this before touching `src/`.

## Hard rules

These are not preferences. Breaking one gets the creative rejected by a network.

1. **No external requests.** No CDN, no fonts, no analytics, no `fetch`, no
   `XMLHttpRequest`, no remote images. The built file must play with the device
   in airplane mode.
2. **No asset files.** Geometry comes from primitives, textures from a
   `<canvas>`, sound from WebAudio oscillators, icons from CSS. If something
   truly needs a bitmap, it goes in as a base64 `data:` URI and the size table
   has to still fit — but generate it first and see if that's enough.
3. **No new dependencies.** three.js is the only runtime package. A physics
   engine, a tween library or a state manager each cost more than the feature
   they buy at this size.
4. **Only `src/ads.js` may touch a network SDK.** No `mraid`, `dapi`,
   `FbPlayableAd`, `gameStart` or `install` anywhere else in the source.
5. **The creative must still play when the SDK is missing.** Every adapter needs
   a browser fallback. A creative that waits forever for an event that never
   fires is a blank ad.
6. **Keep the run under 30 seconds.** Users close ads. Length lives in
   `CONFIG.obstacleBlocks` and the speed values.

## Rendering budget

- No shadow maps, no postprocessing, no `MeshStandardMaterial`.
  `MeshLambertMaterial` and `MeshBasicMaterial` only.
- Cap the pixel ratio at 2 — see `scene.js`; the quality guard drops it once if
  the first two seconds average under ~45 fps.
- Reuse geometries and materials. `level.js` collects both in arrays for a
  reason; anything new goes in the same arrays so `dispose()` stays complete.
- Keep the draw call count in the tens, not the hundreds.
- All motion must be frame-rate independent: `value += (target - value) * (1 -
  Math.exp(-k * delta))`, never `value += (target - value) * k`. Half the target
  devices run at 30 fps.

## Game feel

A creative that plays correctly but feels dead does not convert. Feedback is
what sells the impact, and it follows rules — it is not "add some effects".

**One event fires several small responses at once.** A satisfying hit is 5–8
tiny reactions inside ~100 ms: a sound, a particle burst, a brief freeze, a
colour flash, a knockback, a small camera shake. Each is cheap; stacked, they
read as weight.

**Juice is transient.** Exaggerate briefly, then return to rest. A scale that
never comes back or a shake that never decays becomes the new normal and stops
reading as feedback at all.

**Scale it to importance.** Every juicy event belongs to a tier, so the whole
creative stays proportional:

| Tier | Trauma | Hit-stop | Particles | Our events |
|---|:--:|:--:|:--:|---|
| small | 0.15 | — | ~4 | gem pickup |
| medium | 0.40 | 0.05 s | ~10 | hitting an obstacle |
| large | 0.80 | 0.12 s | ~28 | reaching the finish, losing the last life |

These live in `CONFIG.juice`. Add an event by picking a tier, not by inventing
new numbers.

**Screen shake uses the trauma model.** Keep one `trauma` value in 0..1; events
*add* to it, it decays every frame, and the actual offset is `trauma²` — so
small events barely nudge and big ones punch, and the shake always ends by
itself. Drive the offset from summed sines, never a fresh `Math.random()` per
frame: random-per-frame buzzes like static instead of shaking. Shake the
**camera**, never the marble's simulated position.

**Hit-stop must run on real time.** The freeze works by feeding the gameplay a
zero delta while the render loop keeps going — see `tick()` in `game.js`. The
freeze timer itself counts down on the *real* delta, or it would never expire.
Shake also keeps decaying during a freeze; that combination is what makes an
impact land.

**Ease everything, and pick the curve on purpose.** Overshoot (back-ease) for a
"pop" that should feel alive; ease-out for something settling to rest. Linear
motion reads as mechanical.

Over-juicing is a real failure mode: shake on every routine action is nauseating
and hides the impacts that matter. If in doubt, use the tier below.

*(Model adapted from the open-source `game-feel` agent skill, Apache-2.0 —
`gamedev-skills/awesome-gamedev-agent-skills`.)*

## Code shape

- Plain ES modules, no framework, no reactivity, no classes where a closure and
  a returned object do the job — match the existing files.
- Every tuning number lives in `src/config.js`. A magic number in a scene file
  is a bug waiting for the art lead.
- Naming: `handleXyz` is only for DOM event handlers; everything else gets a
  verb (`createLevel`, `checkGems`, `knockBack`).
- Braces on every `if` / `for` body.
- Comment the *why*, especially the magic numbers Three.js work is full of.
  Don't comment what the code already says.
- No dead or commented-out code. Git has the previous version.

## Definition of done

A change is not finished when it compiles. It is finished when:

1. `npm run build` passes and the size table still fits every limit.
2. The built file has been opened at a phone viewport (390×844 portrait **and**
   844×390 landscape) and actually played through — start, a hit, the endcard,
   replay.
3. The frame rate held at 60 in that session and the SDK log shows no errors.
4. If anything in `src/ads.js` changed, it has been run through `npm run
   harness` in the **No ready**, **No SDK** and **Broken CTA** modes, and the
   creative still plays in all three.

Point 2 is the one that matters. A WebGL bug is invisible to every automated
check in this project.

## Changing the campaign

Store link, speeds, lives, obstacle count: `src/config.js`.
Palette: `COLORS` in `src/level.js` plus the CSS variables in `src/style.css`.
Endcard copy: `finish()` in `src/game.js`.
A new network: one entry in `networks.js`, one adapter in `src/ads.js`.
