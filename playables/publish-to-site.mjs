/**
 * Copies each SDK-less preview build into the games site, so the creatives are
 * playable at /playables/<id>/ on games.abuki.dev.
 *
 * The preview build is the right one to publish: it has no SDK tag to 404 on
 * and its CTA falls back to `window.open`. The per-network builds stay in
 * `dist/` — they are deliverables for a client, not web pages.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CREATIVES } from './creatives.js'
import { outputFile } from './networks.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const siteDir = path.join(root, '..', 'games', 'public', 'playables')

let published = 0

for (const creative of CREATIVES) {
  const source = path.join(root, 'dist', outputFile(creative.id, 'preview'))

  if (!fs.existsSync(source)) {
    console.warn(`skipped ${creative.id} — no preview build (run npm run build)`)
    continue
  }

  const targetDir = path.join(siteDir, creative.id)
  fs.mkdirSync(targetDir, { recursive: true })

  const target = path.join(targetDir, 'index.html')
  fs.copyFileSync(source, target)
  published += 1

  const size = (fs.statSync(target).size / 1024).toFixed(0)
  console.log(`→ games/public/playables/${creative.id}/index.html (${size} KB)`)
}

if (published === 0) {
  console.error('Nothing published.')
  process.exit(1)
}

console.log(`\n${published} creative(s) live at /playables/<id>/ once the games site is deployed`)
