# Frontend conventions (`portfolio`)

Nuxt 4 + Vue 3 (`<script setup>`) + Tailwind + Three.js. These rules apply to
everything under `app/`. They are guidelines — deviate only with a clear reason.

## Commands & gates

```bash
npm run dev        # dev server on http://localhost:3000
npm run lint       # nuxt prepare && eslint .  ← the only automated gate
npm run build      # production build (Nitro node server)
npm run preview    # preview the built server
npm start          # what Railway runs: node .output/server/index.mjs
```

`npm run lint` is the **only** check in this repo — there are no unit tests, no
`typecheck` script, and no CI. Baseline is 0 errors / 0 warnings; keep it there.

Because nothing else verifies behaviour: **a Three.js change is not "done" until
the scene has actually been rendered in a browser.** Run `npm run dev`, open the
experiment, check the console for WebGL/Three warnings, and screenshot it (Playwright
MCP is available). "It compiles" says nothing about a scene.

## Project layout

| Path | What lives there |
|------|------------------|
| `app/pages/lab/<slug>/index.vue` | One Lab experiment (Three.js scene) = one route |
| `app/data/lab.ts` | The list of Lab experiments (titles, descriptions, order) |
| `app/composables/lab/` | Shared scene setup (`useLabScene`) + heavy per-experiment logic |
| `app/components/` | Auto-imported UI components (flat, no subfolders yet) |
| `app/layouts/` | `default` (site chrome) and `lab` (one-screen canvas shell with the site header/footer) |
| `app/assets/css/tailwind.css` | Tailwind entry + `@layer` base/components |
| `public/textures`, `public/models`, `public/environmentMaps`, `public/fonts` | Scene assets, loaded by absolute URL |

Imports use the `@/` alias (`@/composables/...` → `app/`), configured in
`tsconfig.json`. Nuxt's `~/` resolves to the same place — keep using `@/` for
consistency with the existing files. Composables, components and Nuxt utilities
(`useHead`, `useRoute`, `useRequestURL`) are auto-imported; explicit `vue`
imports (`ref`, `onMounted`) are still written out in experiment pages — match the
file you're editing.

## Three.js: build the scene through `useLabScene`

`composables/lab/useLabScene.ts` owns scene, camera, renderer,
`OrbitControls`, `lil-gui` and the loaders. An experiment page asks it for what it
needs — it does not hand-roll a `WebGLRenderer`.

```js
// ✗ a second renderer/camera/controls stack inside the page
const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value })

// ✓ one shared setup, destructure what the experiment uses
const { camera, scene, renderer, controls, gui, textureLoader } = useLabScene(canvasRef, containerRef)
```

Need a loader or capability that isn't there yet (that's how `HDRLoader` and
`FontLoader` arrived)? Add it to `useLabScene` and return it, rather than
instantiating it in the page — unless it is genuinely used by one experiment only
(`GLTFLoader` in `environment-map` is a fair exception).

`useLabScene` reads `containerRef.value.clientWidth/Height`, so it **must** be
called from `onMounted` after a `canvasRef.value && containerRef.value` guard.

## Three.js: every scene must tear itself down

Lab routes are SPA-navigable — leaving a page without cleanup leaks a live
render loop and GPU memory, and a few visits are enough to make the tab crawl.
Every page that starts a scene needs a matching `onUnmounted`:

```js
onUnmounted(() => {
  cancelAnimationFrame(animationId)   // 1. stop the tick first
  gui?.destroy()                      // 2. remove the lil-gui DOM
  controls?.dispose()                 // 3. detach pointer listeners
  // 4. dispose what THIS page created: geometries, materials, textures
  for (const material of inscriptionMaterials) {
    material.alphaMap?.dispose()
    material.normalMap?.dispose()
    material.dispose()
  }
  disposeScene?.()                    // 5. useLabScene's own listeners
  renderer?.dispose()                 // 6. last: drop the GL context
})
```

Rules of thumb:

- Anything you `new`'d that has a `.dispose()` — `BufferGeometry`, `Material`,
  `Texture`, `WebGLRenderTarget` — is yours to dispose. Keep a reference at
  module scope (like `inscriptionMaterials`) if it's created inside a loop.
- Clear every timer you set (`initialLoadTimeoutId` in `haunted-house`).
- Remove every `addEventListener` you add.
- Store `animationId`, `renderer`, `controls`, `gui` in plain `let` outside
  `onMounted` — not in `ref()`; they are not reactive state and wrapping a
  Three.js object in a proxy is a real footgun.

## Three.js: sizing comes from the container, not the window

The canvas lives inside a flex container in the `lab` layout, between the site
header and footer, not fullscreen. Reading `window.innerWidth/innerHeight` makes
the canvas over-render and the aspect ratio drift; `useLabScene`'s resize
handler reads the container, and so must any resize code of your own:

```js
// ✗ assumes the canvas fills the viewport
sizes.width = window.innerWidth

// ✓ the canvas is a box inside the layout
sizes.width = containerRef.value.clientWidth
sizes.height = containerRef.value.clientHeight
```

Cap the pixel ratio — `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`
— on every resize, not just at init.

## Three.js: keep the page thin

An experiment page is scene *composition*: geometry, materials, lights, GUI bindings,
tick. When it grows past ~300 lines, or when a chunk of it is really an
algorithm, move that chunk into `composables/lab/` as a plain
module — `kineticText.ts` (per-letter geometry and spring physics) is the model: typed exports, a doc comment explaining *why*, no Vue reactivity.

Use the existing `/** Section */` block comments (`Textures`, `House`, `Lights`,
`Animate`) to keep long scene files navigable.

## Three.js: assets and the loading state

- Textures live in `public/textures/<subject>/…`, models in `public/models/`,
  HDRIs in `public/environmentMaps/`. Load them by absolute URL (`/textures/…`) —
  they are static files, not bundler imports.
- Prefer **`.webp`** for texture maps (the `door/` folder still has `.jpg`
  duplicates from an earlier experiment — new work shouldn't add more). Keep to 1k
  maps; this is a portfolio, not a game.
- **Colour maps need `texture.colorSpace = THREE.SRGBColorSpace`.** ARM, normal
  and displacement maps must stay linear — setting sRGB on them is a silent
  rendering bug.
- Long loads get the spinner overlay: `isLoading` ref + a `pendingAssets`
  counter decremented from both the success **and** error callbacks, so a 404
  can't leave the overlay stuck forever. `haunted-house` also arms an 8s
  timeout as a backstop — copy that when a scene loads many textures.

## Adding a Lab experiment

1. Create `app/pages/lab/<slug>/index.vue`. The slug is a plain name
   (`kinetic-text`), no course numbers.
2. `definePageMeta({ layout: 'lab' })` + the container/canvas template from an
   existing experiment, and `useLabSeo('<slug>')` for the head.
3. Add it to `labExperiments` in `app/data/lab.ts` (newest first) with the same
   `slug` and RU/EN title and description.
4. Tile assets named by the slug: `public/images/lab/<slug>.webp` (800×450) and
   the clip `public/videos/lab/<slug>.webm` + `.mp4`.
5. `onMounted` init + `onUnmounted` teardown.

`app/data/lab.ts` is the single source of truth for the Lab; there is no
filesystem scan. An experiment that isn't listed is unreachable from the UI.

## SEO: every page carries its own head

Every route sets title, description, OG/Twitter tags, canonical and hreflang
links through `usePageSeo({ title, description })`; Lab experiments call
`useLabSeo('<slug>')`, which builds them from `app/data/lab.ts` in the current
locale. The origin comes from `useRequestURL()` — don't hard-code it: the site
runs on abuki.dev and locally on the dev port.

## TypeScript

New `.vue` files use `<script setup lang="ts">` and new logic goes in `.ts`.
Several experiment pages are still plain JS — that's legacy, not a pattern to copy.

`any` switches off type-checking and hides real bugs. Type props, emits and
composable returns explicitly; for a genuinely unknown value use `unknown` and
narrow it. Shared shapes (like `Project`, `LabExperiment`) are exported `interface`s,
content types in `app/data/types.ts`.

Note there is **no** typecheck script — TS errors will not fail anything
automatically, which is exactly why the types have to be right by hand.

## Tailwind

- Reuse the component classes in `app/assets/css/tailwind.css` (`.btn`,
  `.btn-outline`, `.card`) instead of respelling the same utility chain.
- The accent `#12b488` and the page background `#F9F8F6` are repeated as
  arbitrary values across layouts, pages and components. When you touch such a
  spot, prefer a named token in `tailwind.config.ts` (`theme.extend.colors`) —
  the fonts are already defined there. Don't invent a *new* raw hex.
- Fonts: `font-serif` = DM Serif Display (headings), `font-sans` = DM Sans (body);
  both are loaded from Google Fonts in `nuxt.config.ts`.
- Mobile-first: base classes for small screens, `sm:` / `md:` on top. The lab
  shell relies on `h-screen` + `min-h-0` + `flex-1` to give the canvas its box —
  don't break that chain when restyling layouts.

## Naming

A name should make clear what the thing is on its own.

- `handleXYZ` is reserved for **event handlers** — functions bound to a DOM or
  component event (`handleClick`, `handleExperimentSelect`). Don't give a plain
  callable a `handle*` name.
- Plain functions get verb names: `createGraveInscription()`, `typeText()`,
  `markTextureLoaded()`.
- Composables are `useXxx` and live in `app/composables/`; a module that just
  exports helpers (`kineticText.ts`) is *not* a composable — don't prefix
  it with `use`.
- Avoid single-letter names outside tiny local scopes.

## Comments

The codebase is under-commented. Add a short comment for non-obvious logic —
explain the *why* and the intent. Three.js is full of magic numbers: a
`position.y = 3.5` or a `layers.set(1)` deserves a word about what it lines up
with. Don't comment self-evident code.

## No dead or commented-out code

Don't park disabled code "to keep it around" — git history is the backup.
`24-environment-map/index.vue` currently carries a commented-out `rgbeLoader` /
`GroundedSkybox` block plus stray `// //` fragments; that's the thing to delete,
not to imitate.

```js
// ✗ an old approach left in the file
// rgbeLoader.load('/environmentMaps/2/2k.hdr', (environmentMap) => { … })

// ✓ delete it — the previous version is in git
```

## Control flow

Always use braces `{}` for `if` / `else` / `for` / `while` bodies, even
single-line ones. (`if (!canvasRef.value || !containerRef.value) return` as a
single guard line is fine.)

## Keep scratch output out of the repo

Screenshots, Playwright MCP output (`.playwright-mcp/`), profiling dumps and
one-off scripts don't belong in the project root — write them to the agent
scratch directory. If a screenshot is genuinely worth keeping, put it in
`public/` with a real name and reference it.
