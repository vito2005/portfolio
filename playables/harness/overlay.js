/**
 * On-screen container console. Injected before everything else so the SDK stubs
 * can log into it — on a phone there are no dev tools, so this panel is the only
 * way to see which calls fired and whether anything threw.
 *
 * Debug tool. Never ships.
 */
;(function () {
  var config = window.__harness || { network: 'unknown', mode: 'ok' }
  var pending = []
  var list = null
  var fpsLabel = null
  var startedAt = Date.now()

  function stamp() {
    return ((Date.now() - startedAt) / 1000).toFixed(2) + 's'
  }

  function render(entry) {
    var row = document.createElement('div')
    row.className = 'harness-row harness-' + entry.kind
    row.textContent = stamp() + '  ' + entry.source + '  ' + entry.message
    list.appendChild(row)
    list.scrollTop = list.scrollHeight
  }

  function log(source, message, kind) {
    var entry = { source: source, message: message, kind: kind || 'info' }
    if (list) {
      render(entry)
    } else {
      pending.push(entry)
    }
  }

  /** Big banner so a store click is unmistakable on a phone screen. */
  function storeHit(url) {
    log('CTA', 'store opened → ' + url, 'hit')
    var banner = document.createElement('div')
    banner.className = 'harness-banner'
    banner.textContent = 'STORE OPENED'
    document.body.appendChild(banner)
    setTimeout(function () {
      banner.remove()
    }, 1600)
  }

  window.__harness = {
    network: config.network,
    mode: config.mode,
    log: log,
    storeHit: storeHit,
  }

  /* Errors are invisible on a phone unless we surface them ourselves */

  window.addEventListener('error', function (event) {
    log('error', event.message, 'error')
  })

  window.addEventListener('unhandledrejection', function (event) {
    log('error', 'unhandled rejection: ' + event.reason, 'error')
  })

  var originalError = console.error
  console.error = function () {
    log('console', Array.prototype.join.call(arguments, ' '), 'error')
    originalError.apply(console, arguments)
  }

  function build() {
    var style = document.createElement('style')
    style.textContent = [
      '.harness-panel{position:fixed;left:0;right:0;bottom:0;max-height:38%;display:flex;',
      'flex-direction:column;background:rgba(6,10,20,.92);color:#cfe3ff;font:11px/1.45 ui-monospace,Menlo,monospace;',
      'z-index:99999;border-top:1px solid rgba(120,160,255,.3)}',
      '.harness-head{display:flex;align-items:center;gap:10px;padding:6px 10px;',
      'border-bottom:1px solid rgba(120,160,255,.18);color:#8fb4ff}',
      '.harness-head b{color:#fff;font-weight:700}',
      '.harness-list{overflow-y:auto;padding:6px 10px 10px;-webkit-overflow-scrolling:touch}',
      '.harness-row{white-space:pre-wrap;word-break:break-all;padding:1px 0}',
      '.harness-hit{color:#12ffab;font-weight:700}',
      '.harness-error{color:#ff6b81;font-weight:700}',
      '.harness-toggle{position:fixed;right:8px;bottom:8px;z-index:100000;padding:7px 12px;',
      'border:0;border-radius:99px;background:rgba(6,10,20,.92);color:#8fb4ff;',
      'font:11px ui-monospace,Menlo,monospace}',
      '.harness-banner{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;',
      'z-index:100001;background:rgba(18,180,136,.9);color:#04150f;font:800 26px/1 system-ui,sans-serif;',
      'letter-spacing:.08em;pointer-events:none}',
    ].join('')
    document.head.appendChild(style)

    var panel = document.createElement('div')
    panel.className = 'harness-panel'

    var head = document.createElement('div')
    head.className = 'harness-head'
    head.innerHTML = '<b>' + config.network + '</b> · mode: <b>' + config.mode + '</b> · '
    fpsLabel = document.createElement('span')
    fpsLabel.textContent = 'fps —'
    head.appendChild(fpsLabel)
    panel.appendChild(head)

    list = document.createElement('div')
    list.className = 'harness-list'
    panel.appendChild(list)
    document.body.appendChild(panel)

    var toggle = document.createElement('button')
    toggle.className = 'harness-toggle'
    toggle.textContent = 'log'
    toggle.addEventListener('click', function () {
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none'
    })
    document.body.appendChild(toggle)

    pending.forEach(render)
    pending = []

    log('harness', 'container simulated (mode=' + config.mode + ')')
    measureFps()
  }

  /** The number the ad networks actually care about on a cheap Android. */
  function measureFps() {
    var frames = 0
    var last = performance.now()

    function tick() {
      frames += 1
      var now = performance.now()
      if (now - last >= 1000) {
        fpsLabel.textContent = 'fps ' + Math.round((frames * 1000) / (now - last))
        frames = 0
        last = now
      }
      requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build)
  } else {
    build()
  }
})()
