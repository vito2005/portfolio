import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { NETWORKS } from './networks.js'

// `build.mjs` runs one vite build per network and passes the id through the env.
// Running `npm run dev` on its own gives you the SDK-less preview build.
const networkId = process.env.NETWORK || 'preview'
const network = NETWORKS.find(item => item.id === networkId)

if (!network) {
  throw new Error(`Unknown network "${networkId}". Known: ${NETWORKS.map(item => item.id).join(', ')}`)
}

export default defineConfig({
  // Playables are opened from a file:// URL or a blob inside a WebView, so every
  // path in the document has to be relative.
  base: './',
  define: {
    __ADAPTER__: JSON.stringify(network.adapter),
  },
  plugins: [viteSingleFile()],
  build: {
    outDir: `dist/${networkId}`,
    emptyOutDir: true,
    // WebViews on older Android sit around Chrome 80 — es2019 is the safe floor.
    target: 'es2019',
    cssCodeSplit: false,
    reportCompressedSize: false,
    // Nothing may end up as a separate file: everything is inlined into the HTML.
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
  },
})
