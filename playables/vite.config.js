import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { CREATIVES } from './creatives.js'
import { NETWORKS } from './networks.js'

const here = path.dirname(fileURLToPath(import.meta.url))

// `build.mjs` runs one vite process per creative per network and passes both
// through the env. Running `npm run dev` on its own gives the SDK-less preview
// build of whichever creative CREATIVE points at.
const creativeId = process.env.CREATIVE || CREATIVES[0].id
const networkId = process.env.NETWORK || 'preview'

const creative = CREATIVES.find(item => item.id === creativeId)
const network = NETWORKS.find(item => item.id === networkId)

if (!creative) {
  throw new Error(`Unknown creative "${creativeId}". Known: ${CREATIVES.map(item => item.id).join(', ')}`)
}
if (!network) {
  throw new Error(`Unknown network "${networkId}". Known: ${NETWORKS.map(item => item.id).join(', ')}`)
}

export default defineConfig({
  root: path.join(here, 'creatives', creativeId),
  // Playables are opened from a file:// URL or a blob inside a WebView, so every
  // path in the document has to be relative.
  base: './',
  define: {
    __ADAPTER__: JSON.stringify(network.adapter),
  },
  plugins: [viteSingleFile()],
  server: {
    // The creatives import the engine from ../../shared, which is outside the
    // vite root — dev has to be told that is allowed.
    fs: { allow: [here] },
  },
  build: {
    outDir: path.join(here, 'dist', creativeId, networkId),
    emptyOutDir: true,
    // WebViews on older Android sit around Chrome 80 — es2019 is the safe floor.
    target: 'es2019',
    cssCodeSplit: false,
    reportCompressedSize: false,
    // Nothing may end up as a separate file: everything is inlined into the HTML.
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
  },
})
