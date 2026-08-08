/**
 * Builds one self-contained HTML file per creative per ad network.
 *
 *   node build.mjs                        → everything
 *   node build.mjs sort-3d                → one creative, every network
 *   node build.mjs sort-3d unity meta     → one creative, two networks
 *
 * Each run is a separate vite process so CREATIVE and NETWORK are picked up
 * cleanly by vite.config.js. Afterwards the network's own SDK tag is injected
 * into the finished HTML and the temporary output folder is removed.
 */
import { execFileSync } from 'node:child_process'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { CREATIVES } from './creatives.js'
import { NETWORKS, outputFile } from './networks.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const distDir = path.join(root, 'dist')

const args = process.argv.slice(2)
const creativeIds = new Set(CREATIVES.map(item => item.id))
const networkIds = new Set(NETWORKS.map(item => item.id))

const requestedCreatives = args.filter(arg => creativeIds.has(arg))
const requestedNetworks = args.filter(arg => networkIds.has(arg))
const unknown = args.filter(arg => !creativeIds.has(arg) && !networkIds.has(arg))

if (unknown.length) {
  console.error(`Unknown argument(s): ${unknown.join(', ')}`)
  console.error(`Creatives: ${[...creativeIds].join(', ')}`)
  console.error(`Networks:  ${[...networkIds].join(', ')}`)
  process.exit(1)
}

const targetCreatives = requestedCreatives.length
  ? CREATIVES.filter(item => requestedCreatives.includes(item.id))
  : CREATIVES
const targetNetworks = requestedNetworks.length
  ? NETWORKS.filter(item => requestedNetworks.includes(item.id))
  : NETWORKS

if (!fs.existsSync(viteBin)) {
  console.error('vite is not installed — run `npm install` in playables first.')
  process.exit(1)
}

// Only wipe what this run rebuilds, so building one creative leaves the others.
for (const creative of targetCreatives) {
  fs.rmSync(path.join(distDir, creative.id), { recursive: true, force: true })
  for (const network of targetNetworks) {
    fs.rmSync(path.join(distDir, outputFile(creative.id, network.id)), { force: true })
  }
}
fs.mkdirSync(distDir, { recursive: true })

const results = []

for (const creative of targetCreatives) {
  for (const network of targetNetworks) {
    console.log(`\n▸ ${creative.label} → ${network.label}`)

    execFileSync(process.execPath, [viteBin, 'build'], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, CREATIVE: creative.id, NETWORK: network.id },
    })

    const tempDir = path.join(distDir, creative.id, network.id)
    let html = fs.readFileSync(path.join(tempDir, 'index.html'), 'utf8')

    if (network.headTag) {
      html = html.replace('</head>', `${network.headTag}</head>`)
    }

    const outFile = path.join(distDir, outputFile(creative.id, network.id))
    fs.writeFileSync(outFile, html)
    fs.rmSync(tempDir, { recursive: true, force: true })

    const raw = Buffer.byteLength(html)
    results.push({
      creative: creative.label,
      label: network.label,
      file: path.basename(outFile),
      raw,
      gzip: gzipSync(html).length,
      maxBytes: network.maxBytes,
    })
  }
  fs.rmSync(path.join(distDir, creative.id), { recursive: true, force: true })
}

const kb = bytes => `${(bytes / 1024).toFixed(0)} KB`
let over = 0

console.log('\n  creative      network                      raw     gzip    limit   used')
console.log('  ' + '─'.repeat(76))

let lastCreative = null
for (const result of results) {
  const share = (result.raw / result.maxBytes) * 100
  if (share > 100) {
    over += 1
  }
  console.log(
    '  '
    + (result.creative === lastCreative ? '' : result.creative).padEnd(14)
    + result.label.padEnd(28)
    + kb(result.raw).padStart(7)
    + kb(result.gzip).padStart(8)
    + kb(result.maxBytes).padStart(9)
    + `${share.toFixed(1)}%`.padStart(8)
    + (share > 100 ? '  ← OVER LIMIT' : ''),
  )
  lastCreative = result.creative
}

console.log(`\n  → ${results.length} file(s) in playables/dist\n`)

if (over > 0) {
  console.error(`${over} build(s) exceed the network limit.`)
  process.exit(1)
}
