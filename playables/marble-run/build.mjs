/**
 * Builds one self-contained HTML file per ad network.
 *
 *   node build.mjs              → every network in networks.js
 *   node build.mjs unity meta   → just those two
 *
 * Each run is a separate vite process so the NETWORK env var is picked up
 * cleanly by vite.config.js. Afterwards the network's own SDK tag is injected
 * into the finished HTML and the temporary output folder is removed.
 */
import { execFileSync } from 'node:child_process'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { NETWORKS, outputFile } from './networks.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const distDir = path.join(root, 'dist')

const requested = process.argv.slice(2)
const targets = requested.length
  ? NETWORKS.filter(network => requested.includes(network.id))
  : NETWORKS

if (!targets.length) {
  console.error(`No matching network. Known: ${NETWORKS.map(n => n.id).join(', ')}`)
  process.exit(1)
}

if (!fs.existsSync(viteBin)) {
  console.error('vite is not installed — run `npm install` in playables/marble-run first.')
  process.exit(1)
}

fs.rmSync(distDir, { recursive: true, force: true })
fs.mkdirSync(distDir, { recursive: true })

const results = []

for (const network of targets) {
  console.log(`\n▸ building ${network.label}`)

  execFileSync(process.execPath, [viteBin, 'build'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, NETWORK: network.id },
  })

  const tempDir = path.join(distDir, network.id)
  const builtHtml = path.join(tempDir, 'index.html')
  let html = fs.readFileSync(builtHtml, 'utf8')

  if (network.headTag) {
    html = html.replace('</head>', `${network.headTag}</head>`)
  }

  const outFile = path.join(distDir, outputFile(network.id))
  fs.writeFileSync(outFile, html)
  fs.rmSync(tempDir, { recursive: true, force: true })

  const raw = Buffer.byteLength(html)
  results.push({
    label: network.label,
    file: path.basename(outFile),
    raw,
    gzip: gzipSync(html).length,
    maxBytes: network.maxBytes,
  })
}

const kb = bytes => `${(bytes / 1024).toFixed(0)} KB`

console.log('\n  network                      file                            raw     gzip    limit   used')
console.log('  ' + '─'.repeat(90))

for (const result of results) {
  const share = ((result.raw / result.maxBytes) * 100).toFixed(1)
  console.log(
    '  '
    + result.label.padEnd(28)
    + result.file.padEnd(32)
    + kb(result.raw).padStart(7)
    + kb(result.gzip).padStart(8)
    + kb(result.maxBytes).padStart(9)
    + `${share}%`.padStart(8),
  )
}

console.log(`\n  → ${results.length} file(s) in playables/marble-run/dist\n`)
