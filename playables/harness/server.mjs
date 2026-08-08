/**
 * Local ad-container simulator: serves the built creatives with a fake network
 * SDK beside them, the way a real ad player does.
 *
 *   npm run harness   → http://<your-lan-ip>:5183
 *
 * The failure mode lives in the path, not a query string — the creative asks for
 * its SDK by relative path (`mraid.js`), which a query string would not reach.
 *
 *   /play/ok/marble-run/google.html          SDK loads, ready fires at once
 *   /play/never/sort-3d/applovin.html        ready never fires — watchdog takes over
 *   /play/missing/marble-run/google.html     the SDK script 404s
 *   /play/broken/marble-run/ironsource.html  the CTA call throws
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { CREATIVES } from '../creatives.js'
import { NETWORKS, outputFile } from '../networks.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(here, '..', 'dist')
const port = Number(process.env.PORT) || 5183

const MODES = [
  { id: 'ok', label: 'Normal', hint: 'SDK loads, ready fires at once' },
  { id: 'late', label: 'Slow SDK', hint: 'ready arrives after 3 s' },
  { id: 'never', label: 'No ready', hint: 'ready never fires — the watchdog must start the game' },
  { id: 'missing', label: 'No SDK', hint: 'the SDK script 404s' },
  { id: 'broken', label: 'Broken CTA', hint: 'the store call throws' },
]

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }

/**
 * SDKs the creative cannot ask for by relative path: Meta injects a global with
 * no script at all, and Google loads its Exit API from its own domain. Both get
 * a local stub so the simulator keeps working offline.
 */
const INJECTED_STUBS = { meta: 'meta.js', google: 'exitapi.js' }

function builtFile(creativeId, networkId) {
  return path.join(distDir, outputFile(creativeId, networkId))
}

/** Puts the console, and any stubbed SDK, in front of the creative. */
function injectHarness(html, network, mode) {
  let output = html

  // A tag pointing at the network's own domain can't be intercepted by path.
  if (network.headTag.includes('https://')) {
    output = output.replace(network.headTag, '')
  }

  const stub = INJECTED_STUBS[network.id]
  const config = JSON.stringify({ network: network.id, mode })

  return output.replace(
    '<head>',
    `<head><script>window.__harness=${config}</script>`
    + '<script src="/harness/overlay.js"></script>'
    + (stub ? `<script src="/harness/sdk/${stub}"></script>` : ''),
  )
}

function send(response, status, body, type = 'text/html') {
  response.writeHead(status, {
    'Content-Type': `${type}; charset=utf-8`,
    'Cache-Control': 'no-store',
  })
  response.end(body)
}

function sendFile(response, file) {
  if (!fs.existsSync(file)) {
    send(response, 404, 'not found', 'text/plain')
    return
  }
  send(response, 200, fs.readFileSync(file), MIME[path.extname(file)] || 'text/plain')
}

function launcherPage() {
  const sections = CREATIVES.map((creative) => {
    const available = NETWORKS.filter(network => fs.existsSync(builtFile(creative.id, network.id)))
    if (!available.length) {
      return ''
    }

    const rows = available.map((network) => {
      const links = MODES.map(mode => (
        `<a href="/play/${mode.id}/${creative.id}/${network.id}.html" title="${mode.hint}">${mode.label}</a>`
      )).join('')
      return `<tr><th>${network.label}</th><td>${links}</td></tr>`
    }).join('')

    return `<h2>${creative.label}</h2><table>${rows}</table>`
  }).filter(Boolean).join('')

  if (!sections) {
    return '<meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<body style="font:16px system-ui;padding:32px">'
      + '<h1>No builds found</h1><p>Run <code>npm run build</code> first.</p>'
  }

  const legend = MODES.map(mode => `<li><b>${mode.label}</b> — ${mode.hint}</li>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Container simulator</title>
<style>
  body{margin:0;padding:28px 20px 60px;background:#0d1424;color:#e8eeff;
    font:15px/1.5 system-ui,-apple-system,sans-serif}
  h1{font-size:20px;margin:0 0 4px}
  h2{font-size:15px;margin:28px 0 2px;color:#12b488}
  p.sub{margin:0 0 8px;color:#7f93bd;font-size:13px}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:13px;color:#9db3e0;padding:12px 0 6px;font-weight:600}
  td{padding:0 0 14px}
  a{display:inline-block;margin:0 6px 6px 0;padding:9px 13px;border-radius:9px;
    background:#1b2743;color:#8fd8ff;text-decoration:none;font-size:13px}
  a:active{background:#12b488;color:#04150f}
  ul{margin:28px 0 0;padding-left:18px;color:#7f93bd;font-size:12.5px}
  li{margin-bottom:5px}
  b{color:#cfe0ff}
</style></head><body>
<h1>Ad container simulator</h1>
<p class="sub">Pick a creative, a network and a failure mode. The log panel at the
bottom of the creative shows every SDK call, plus the frame rate.</p>
${sections}
<ul>${legend}</ul>
</body></html>`
}

function lanAddress() {
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address
      }
    }
  }
  return 'localhost'
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost')
  const parts = url.pathname.split('/').filter(Boolean)

  if (parts.length === 0) {
    send(response, 200, launcherPage())
    return
  }

  // /harness/overlay.js, /harness/sdk/<name>.js
  if (parts[0] === 'harness') {
    sendFile(response, path.join(here, ...parts.slice(1)))
    return
  }

  // /play/<mode>/<creative>/<file>
  if (parts[0] === 'play' && parts.length === 4) {
    const [, mode, creativeId, file] = parts
    const creative = CREATIVES.find(item => item.id === creativeId)

    if (!creative) {
      send(response, 404, `Unknown creative "${creativeId}"`, 'text/plain')
      return
    }

    if (file.endsWith('.html')) {
      const networkId = file.replace(/\.html$/, '')
      const network = NETWORKS.find(item => item.id === networkId)
      const source = network && builtFile(creativeId, networkId)

      if (!source || !fs.existsSync(source)) {
        send(response, 404, `No build for ${creativeId}/${networkId} — run npm run build`, 'text/plain')
        return
      }

      send(response, 200, injectHarness(fs.readFileSync(source, 'utf8'), network, mode))
      return
    }

    // The creative asks for its SDK by relative path; this is where it lands.
    if (file === 'mraid.js' || file === 'dapi.js') {
      if (mode === 'missing') {
        send(response, 404, 'sdk withheld on purpose', 'text/plain')
        return
      }
      sendFile(response, path.join(here, 'sdk', file))
      return
    }
  }

  send(response, 404, 'not found', 'text/plain')
})

let renderQr = null
try {
  renderQr = (await import('qrcode-terminal')).default
} catch {
  // Optional: without it we just print the address.
}

server.listen(port, '0.0.0.0', () => {
  const address = `http://${lanAddress()}:${port}`
  console.log('\n  Ad container simulator')
  console.log(`  local   http://localhost:${port}`)
  console.log(`  phone   ${address}   (same Wi-Fi)\n`)
  if (renderQr) {
    renderQr.generate(address, { small: true })
  }
})
