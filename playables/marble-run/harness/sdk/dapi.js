/**
 * Fake DAPI container — ironSource.
 *
 * ironSource does not use MRAID: the creative gets `dapi.js` and a different
 * API shape. Same idea as the MRAID stub, same `mode` switches.
 */
;(function () {
  var harness = window.__harness || { mode: 'ok', log: function () {}, storeHit: function () {} }
  var mode = harness.mode
  var listeners = {}
  var ready = false

  function emit(event) {
    var callbacks = listeners[event] || []
    harness.log('dapi', 'fire "' + event + '" → ' + callbacks.length + ' listener(s)')
    for (var index = 0; index < callbacks.length; index += 1) {
      callbacks[index]()
    }
  }

  window.dapi = {
    isReady: function () {
      harness.log('dapi', 'isReady() → ' + ready)
      return ready
    },

    addEventListener: function (event, callback) {
      harness.log('dapi', 'addEventListener("' + event + '")')
      listeners[event] = listeners[event] || []
      listeners[event].push(callback)
    },

    removeEventListener: function (event, callback) {
      listeners[event] = (listeners[event] || []).filter(function (item) {
        return item !== callback
      })
    },

    openStoreUrl: function (options) {
      var url = (options && options.url) || ''
      harness.log('dapi', 'openStoreUrl({ url: "' + url + '" })')
      if (mode === 'broken') {
        harness.log('dapi', 'container refused the click', 'error')
        throw new Error('dapi.openStoreUrl failed inside the container')
      }
      harness.storeHit(url)
    },

    reportAdClicked: function () {
      harness.log('dapi', 'reportAdClicked()')
    },
  }

  harness.log('dapi', 'sdk injected, not ready yet')

  function becomeReady() {
    ready = true
    emit('ready')
  }

  if (mode === 'never') {
    harness.log('dapi', 'this container will never become ready — the creative must start on its own', 'error')
  } else if (mode === 'late') {
    setTimeout(becomeReady, 3000)
  } else {
    setTimeout(becomeReady, 60)
  }
})()
