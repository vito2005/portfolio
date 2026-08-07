/**
 * Fake Meta container.
 *
 * Meta injects a single global instead of an SDK file, and there is no ready
 * event at all — the creative is expected to start on its own. The `missing`
 * mode leaves the global undefined so the browser fallback can be checked.
 */
;(function () {
  var harness = window.__harness || { mode: 'ok', log: function () {}, storeHit: function () {} }
  var mode = harness.mode

  if (mode === 'missing') {
    harness.log('meta', 'FbPlayableAd not injected — creative must fall back to window.open', 'error')
    return
  }

  window.FbPlayableAd = {
    onCTAClick: function () {
      harness.log('meta', 'FbPlayableAd.onCTAClick()')
      if (mode === 'broken') {
        harness.log('meta', 'container refused the click', 'error')
        throw new Error('FbPlayableAd.onCTAClick failed inside the container')
      }
      harness.storeHit('(store url is set on Meta’s side, not in the creative)')
    },
  }

  harness.log('meta', 'FbPlayableAd injected')
})()
