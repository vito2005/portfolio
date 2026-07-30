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
`typecheck` script, and no CI. Baseline is 0 errors / a handful of
`vue/html-self-closing` warnings in `PoweredBy.vue`; don't add new errors.

Because nothing else verifies behaviour: **a Three.js change is not "done" until
the scene has actually been rendered in a browser.** Run `npm run dev`, open the
lesson, check the console for WebGL/Three warnings, and screenshot it (Playwright
MCP is available). "It compiles" says nothing about a scene.

## Project layout

| Path | What lives there |
|------|------------------|
| `app/pages/lessons/<order>-<slug>/index.vue` | One Three.js lesson = one route |
| `app/composables/three-js-lessons/` | Shared scene setup + heavy per-lesson logic |
| `app/components/` | Auto-imported UI components (flat, no subfolders yet) |
| `app/layouts/` | `default` (site chrome) and `lessons` (full-height canvas shell) |
| `app/assets/css/tailwind.css` | Tailwind entry + `@layer` base/components |
| `public/textures`, `public/models`, `public/environmentMaps`, `public/fonts` | Scene assets, loaded by absolute URL |

Imports use the `@/` alias (`@/composables/...` → `app/`), configured in
`tsconfig.json`. Nuxt's `~/` resolves to the same place — keep using `@/` for
consistency with the existing files. Composables, components and Nuxt utilities
(`useHead`, `useRoute`, `useRequestURL`) are auto-imported; explicit `vue`
imports (`ref`, `onMounted`) are still written out in lesson pages — match the
file you're editing.

## Three.js: build the scene through `useLesson`

`composables/three-js-lessons/useLesson.ts` owns scene, camera, renderer,
`OrbitControls`, `lil-gui` and the loaders. A lesson page asks it for what it
needs — it does not hand-roll a `WebGLRenderer`.

```js
// ✗ a second renderer/camera/controls stack inside the page
const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value })

// ✓ one shared setup, destructure what the lesson uses
const { camera, scene, renderer, controls, gui, textureLoader } = useLesson(canvasRef, containerRef)
```

Need a loader or capability that isn't there yet (that's how `HDRLoader` and
`FontLoader` arrived)? Add it to `useLesson` and return it, rather than
instantiating it in the page — unless it is genuinely used by one lesson only
(`GLTFLoader` in `24-environment-map` is a fair exception).

`useLesson` reads `containerRef.value.clientWidth/Height`, so it **must** be
called from `onMounted` after a `canvasRef.value && containerRef.value` guard.

## Three.js: every scene must tear itself down

Lesson routes are SPA-navigable — leaving a page without cleanup leaks a live
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
  renderer?.dispose()                 // 5. last: drop the GL context
})
```

Rules of thumb:

- Anything you `new`'d that has a `.dispose()` — `BufferGeometry`, `Material`,
  `Texture`, `WebGLRenderTarget` — is yours to dispose. Keep a reference at
  module scope (like `inscriptionMaterials`) if it's created inside a loop.
- Clear every timer you set (`initialLoadTimeoutId` in `16-haunted-house`).
- Remove every `addEventListener` you add.
- Store `animationId`, `renderer`, `controls`, `gui` in plain `let` outside
  `onMounted` — not in `ref()`; they are not reactive state and wrapping a
  Three.js object in a proxy is a real footgun.

Known debt: `11-materials/index.vue` has no `onUnmounted` at all, and
`useLesson`'s internal `resize` listener is never removed. Fix these when you
touch those files — don't copy the pattern into a new lesson.

## Three.js: sizing comes from the container, not the window

The canvas lives inside a flex container in the `lessons` layout, not fullscreen.
`useLesson`'s `handleResize` currently reads `window.innerWidth/innerHeight`,
which is wrong the moment header/footer chrome exists — the canvas over-renders
and the aspect ratio drifts. New or edited resize code reads the container:

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

A lesson page is scene *composition*: geometry, materials, lights, GUI bindings,
tick. When it grows past ~300 lines, or when a chunk of it is really an
algorithm, move that chunk into `composables/three-js-lessons/` as a plain
module — `graveInscriptions.ts` (procedural canvas epitaphs → alpha/normal maps)
is the model: typed exports, a doc comment explaining *why*, no Vue reactivity.

Use the existing `/** Section */` block comments (`Textures`, `House`, `Lights`,
`Animate`) to keep long scene files navigable.

## Three.js: assets and the loading state

- Textures live in `public/textures/<subject>/…`, models in `public/models/`,
  HDRIs in `public/environmentMaps/`. Load them by absolute URL (`/textures/…`) —
  they are static files, not bundler imports.
- Prefer **`.webp`** for texture maps (the `door/` folder still has `.jpg`
  duplicates from an earlier lesson — new work shouldn't add more). Keep to 1k
  maps; this is a portfolio, not a game.
- **Colour maps need `texture.colorSpace = THREE.SRGBColorSpace`.** ARM, normal
  and displacement maps must stay linear — setting sRGB on them is a silent
  rendering bug.
- Long loads get the spinner overlay: `isLoading` ref + a `pendingAssets`
  counter decremented from both the success **and** error callbacks, so a 404
  can't leave the overlay stuck forever. `16-haunted-house` also arms an 8s
  timeout as a backstop — copy that when a scene loads many textures.

## Adding a lesson

1. Create `app/pages/lessons/<order>-<slug>/index.vue` (folder name = the
   ExerciseNN-slug used by the source course).
2. `definePageMeta({ layout: 'lessons' })` + the container/canvas template from
   an existing lesson.
3. Add the SEO `useHead` block (below).
4. Register it in `composables/three-js-lessons/useLessons.ts` — `id`, `order`
   and `path` must agree with the folder name, or the layout's dropdown and the
   `/lessons` index will disagree with the router.
5. `onMounted` init + `onUnmounted` teardown.

`useLessons` is the single source of truth for the lesson list; there is no
filesystem scan. A lesson that isn't registered is unreachable from the UI.

## SEO: every page carries its own head

Every route sets title, description, OG/Twitter tags and a canonical link built
from `useRequestURL()`. Copy the block from an existing page and change the two
`seoTitle` / `seoDescription` constants:

```js
const route = useRoute()
const url = useRequestURL()
const canonicalUrl = url.origin + route.path

useHead({ title: seoTitle, meta: [...], link: [{ rel: 'canonical', href: canonicalUrl }] })
```

Don't hard-code the origin — the site runs on Railway behind a real domain and
locally on `:3000`.

## TypeScript

New `.vue` files use `<script setup lang="ts">` and new logic goes in `.ts`.
Several lesson pages are still plain JS — that's legacy, not a pattern to copy.

`any` switches off type-checking and hides real bugs. Type props, emits and
composable returns explicitly; for a genuinely unknown value use `unknown` and
narrow it. Shared shapes (like `Lesson`) are exported `interface`s from the
composable that owns them.

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
- Mobile-first: base classes for small screens, `sm:` / `md:` on top. The lesson
  shell relies on `h-screen` + `min-h-0` + `flex-1` to give the canvas its box —
  don't break that chain when restyling layouts.

## Naming

A name should make clear what the thing is on its own.

- `handleXYZ` is reserved for **event handlers** — functions bound to a DOM or
  component event (`handleClick`, `handleLessonSelect`). Don't give a plain
  callable a `handle*` name.
- Plain functions get verb names: `createGraveInscription()`, `typeText()`,
  `markTextureLoaded()`.
- Composables are `useXxx` and live in `app/composables/`; a module that just
  exports helpers (`graveInscriptions.ts`) is *not* a composable — don't prefix
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
