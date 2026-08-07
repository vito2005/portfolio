/**
 * Fake MRAID container — Google Ads, Unity Ads, AppLovin, Mintegral.
 *
 * A stand-in for the `mraid.js` the real ad player injects next to the
 * creative. It implements just enough of MRAID 2.0 for a playable, logs every
 * call to the on-screen console, and can be told to misbehave (see `mode`).
 */
;(function () {
  var harness = window.__harness || { mode: 'ok', log: function () {}, storeHit: function () {} }
  var mode = harness.mode
  var listeners = {}
  var state = 'loading'

  function emit(event) {
    var callbacks = listeners[event] || []
    harness.log('mraid', 'fire "' + event + '" → ' + callbacks.length + ' listener(s)')
    for (var index = 0; index < callbacks.length; index += 1) {
      callbacks[index]()
    }
  }

  window.mraid = {
    getVersion: function () {
      return '2.0'
    },

    getState: function () {
      harness.log('mraid', 'getState() → "' + state + '"')
      return state
    },

    getPlacementType: function () {
      return 'interstitial'
    },

    isViewable: function () {
      return true
    },

    addEventListener: function (event, callback) {
      harness.log('mraid', 'addEventListener("' + event + '")')
      listeners[event] = listeners[event] || []
      listeners[event].push(callback)
    },

    removeEventListener: function (event, callback) {
      listeners[event] = (listeners[event] || []).filter(function (item) {
        return item !== callback
      })
    },

    open: function (url) {
      harness.log('mraid', 'open("' + url + '")')
      if (mode === 'broken') {
        harness.log('mraid', 'container refused the click', 'error')
        throw new Error('mraid.open failed inside the container')
      }
      harness.storeHit(url)
    },

    close: function () {
      harness.log('mraid', 'close()')
      state = 'hidden'
    },

    useCustomClose: function () {},
    expand: function () {},
  }

  harness.log('mraid', 'sdk injected, state="loading"')

  function becomeReady() {
    state = 'default'
    emit('ready')
  }

  if (mode === 'never') {
    harness.log('mraid', 'this container will never fire "ready" — the creative must start on its own', 'error')
  } else if (mode === 'late') {
    setTimeout(becomeReady, 3000)
  } else {
    setTimeout(becomeReady, 60)
  }
})()
