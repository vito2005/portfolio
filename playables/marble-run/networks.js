/**
 * One entry per ad network we ship to.
 *
 * `adapter` picks the CTA implementation in `src/ads.js`.
 * `headTag` is injected into the built HTML after the bundle is inlined — these
 * scripts are provided by the network's own player, so they must stay external.
 *
 * The limits below are the sizes commonly quoted in the networks' playable
 * specs. They move around: check the current spec before a real delivery.
 */
/** The networks quote their limits in megabytes; this keeps the table readable. */
const MB = 1024 * 1024

/** One naming convention, shared by the build, the harness and publishing. */
export function outputFile(networkId) {
  return `marble-run-${networkId}.html`
}

export const NETWORKS = [
  {
    id: 'preview',
    label: 'Preview (no SDK)',
    adapter: 'preview',
    headTag: '',
    maxBytes: 5 * MB,
  },
  {
    id: 'google',
    label: 'Google Ads (App campaigns)',
    // Google's playable format does not use MRAID: it has its own Exit API, and
    // the H5 validator fails the bundle without an `ExitApi.exit()` call.
    // Its script is hosted by Google and is one of the few externals allowed.
    adapter: 'exitapi',
    headTag: '<script src="https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js"></script>',
    maxBytes: 5 * MB,
  },
  {
    id: 'unity',
    label: 'Unity Ads',
    adapter: 'mraid',
    headTag: '<script src="mraid.js"></script>',
    maxBytes: 5 * MB,
  },
  {
    id: 'applovin',
    label: 'AppLovin',
    adapter: 'mraid',
    headTag: '<script src="mraid.js"></script>',
    maxBytes: 5 * MB,
  },
  {
    id: 'mintegral',
    label: 'Mintegral',
    adapter: 'mintegral',
    headTag: '<script src="mraid.js"></script>',
    maxBytes: 3 * MB,
  },
  {
    id: 'ironsource',
    label: 'ironSource',
    adapter: 'dapi',
    headTag: '<script src="dapi.js"></script>',
    maxBytes: 5 * MB,
  },
  {
    id: 'meta',
    label: 'Meta (Facebook)',
    adapter: 'meta',
    headTag: '',
    // The tightest budget of the lot: Meta caps a playable at 2 MB, and the
    // format is a single index.html with every asset inlined as base64.
    maxBytes: 2 * MB,
  },
]
