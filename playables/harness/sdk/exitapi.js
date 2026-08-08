/**
 * Fake Exit API container — Google Ads playables in App campaigns.
 *
 * Google hosts the real `exitapi.js` on its own domain, which the harness
 * strips out so the simulator keeps working offline. There is no ready event in
 * this format: the creative starts on its own and only signals the exit.
 */
;(function () {
  var harness = window.__harness || { mode: 'ok', log: function () {}, storeHit: function () {} }
  var mode = harness.mode

  if (mode === 'missing') {
    harness.log('exitapi', 'ExitApi not injected — creative must fall back to window.open', 'error')
    return
  }

  window.ExitApi = {
    exit: function () {
      harness.log('exitapi', 'ExitApi.exit()')
      if (mode === 'broken') {
        harness.log('exitapi', 'container refused the exit', 'error')
        throw new Error('ExitApi.exit failed inside the container')
      }
      harness.storeHit('(store url is set on Google’s side, not in the creative)')
    },
  }

  harness.log('exitapi', 'ExitApi injected')
})()
