/**
 * Copies the SDK-less preview build into the games site, so the creative is
 * playable at /playables/marble-run/ on games.abuki.dev.
 *
 * The preview build is the right one to publish: it has no SDK tag to 404 on
 * and its CTA falls back to `window.open`. The per-network builds stay in
 * `dist/` — they are deliverables for a client, not web pages.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { outputFile } from './networks.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const source = path.join(root, 'dist', outputFile('preview'))
const targetDir = path.join(root, '..', '..', 'games', 'public', 'playables', 'marble-run')
const target = path.join(targetDir, 'index.html')

if (!fs.existsSync(source)) {
  console.error('No preview build found — run `npm run build` first.')
  process.exit(1)
}

fs.mkdirSync(targetDir, { recursive: true })
fs.copyFileSync(source, target)

const size = (fs.statSync(target).size / 1024).toFixed(0)
console.log(`→ games/public/playables/marble-run/index.html (${size} KB)`)
console.log('  live at /playables/marble-run/ once the games site is deployed')
