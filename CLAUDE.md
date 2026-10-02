# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## What this is

Personal portfolio of a 3D web engineer: a small Nuxt 4 site (landing + about)
plus a growing **Lab** of interactive Three.js experiments at `/lab/*`, each a
self-contained WebGL scene with `lil-gui` controls. Rendered SSR by Nitro and
deployed on Railway (`npm start` → `.output/server/index.mjs`).

Stack: Nuxt 4 · Vue 3 `<script setup>` · Tailwind (v3, `@nuxtjs/tailwindcss`) ·
three 0.182 · lil-gui · `@nuxt/image` · ESLint via `@nuxt/eslint`.

## Conventions

Coding conventions live in `AGENTS.md` so they are shared across AI tools
(different models get used here). They are imported below:

@AGENTS.md

## Working notes

- `npm run lint` is the only automated gate — no tests, no typecheck, no CI.
  Verify Three.js work by actually running `npm run dev` and looking at the
  scene; a WebGL bug is invisible to the linter.
- The experiment list in `app/data/lab.ts` is the
  single source of truth for navigation — routes are not scanned.
- Scene lifecycle (dispose on unmount) is the most common source of real bugs
  here; see the Three.js sections of `AGENTS.md` before editing an experiment.
