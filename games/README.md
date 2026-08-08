# Games site

Showcase for the playable ad creatives, deployed separately from the portfolio
at **games.abuki.dev**. Second Nuxt app in this repo; the portfolio lives at the
repo root.

```bash
npm run games:dev      # from the repo root → http://localhost:3001
npm run games:build
npm run games:start
```

Design tokens come from `shared/design/preset.ts`, the same preset the portfolio
uses, so the palette and fonts stay in one place.

## Where the creatives come from

`games/public/playables/<name>/index.html` is a finished single-file creative,
copied here by `npm run publish:site` inside `playables/<name>/`. Nuxt never
processes these files — Nitro serves them byte for byte, which is the whole
point: the same file goes to an ad network.

Add a game by dropping its build into `public/playables/` and adding an entry to
`app/composables/useGames.ts`. There is no filesystem scan.

## Railway

Both this app and the portfolio deploy from the same GitHub repo, as two
services. The settings that matter:

| Setting | Portfolio service | This service |
|---|---|---|
| Root Directory | *(empty)* | *(empty)* |
| Railway Config File | `/railway.json` | `/games/railway.json` |

**Root Directory must stay empty for this service.** Railway only downloads the
subtree under the root directory, so setting it to `games` would hide
`shared/design/` and the build would fail on a missing import.

Because config-as-code overrides the dashboard, the build and start commands
live in `railway.json`, not in the UI — pointing this service at the root
`railway.json` by mistake makes it run the portfolio's start command and crash
with `Cannot find module '/app/.output/server/index.mjs'`.
