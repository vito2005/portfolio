/**
 * The only place that talks to an ad network. Shared by every creative.
 *
 * `__ADAPTER__` is replaced at build time by vite, so a build for one network
 * never carries another network's code.
 */

const adapter = typeof __ADAPTER__ === 'string' ? __ADAPTER__ : 'preview'

/** A container that loads its SDK but never fires `ready` must not leave a blank ad. */
const READY_TIMEOUT = 3000

let fallbackStoreUrl = ''

/** Each creative hands over its own campaign link at boot. */
export function setStoreUrl(url) {
  fallbackStoreUrl = url
}

/** Ad servers rewrite `clickTag` to their own tracking URL, so it wins when present. */
function storeUrl() {
  return typeof window.clickTag === 'string' && window.clickTag ? window.clickTag : fallbackStoreUrl
}

function canCall(host, method) {
  return Boolean(host) && typeof host[method] === 'function'
}

/** Every adapter's fallback: a dead ad is the worst possible outcome. */
function openInBrowser() {
  window.open(storeUrl(), '_blank')
}

/** No container, or one that is already up, means start now; otherwise wait for it. */
function waitForContainer(host, isUp, callback) {
  if (!host || isUp()) {
    callback()
  } else {
    host.addEventListener('ready', callback)
  }
}

const startNow = callback => callback()

/* MRAID — Unity Ads, AppLovin, Mintegral */

function mraidWhenReady(callback) {
  waitForContainer(window.mraid, () => window.mraid.getState() !== 'loading', callback)
}

function mraidOpen() {
  if (canCall(window.mraid, 'open')) {
    window.mraid.open(storeUrl())
  } else {
    openInBrowser()
  }
}

/* DAPI — ironSource */

function dapiWhenReady(callback) {
  waitForContainer(window.dapi, () => window.dapi.isReady(), callback)
}

function dapiOpen() {
  if (canCall(window.dapi, 'openStoreUrl')) {
    window.dapi.openStoreUrl({ url: storeUrl() })
  } else {
    openInBrowser()
  }
}

/* Exit API — Google Ads, App campaigns. No ready event in this format. */

/** Must sit directly in the CTA handler: wrapping it in `window.open` breaks the exit. */
function exitApiOpen() {
  if (canCall(window.ExitApi, 'exit')) {
    window.ExitApi.exit()
  } else {
    openInBrowser()
  }
}

/* Meta — a single global the container injects, no SDK file */

function metaOpen() {
  if (canCall(window.FbPlayableAd, 'onCTAClick')) {
    window.FbPlayableAd.onCTAClick()
  } else {
    openInBrowser()
  }
}

/* Mintegral — its own globals on top of MRAID */

function mintegralOpen() {
  if (canCall(window, 'install')) {
    window.install()
  } else {
    mraidOpen()
  }
}

function mintegralStart() {
  if (canCall(window, 'gameStart')) {
    window.gameStart()
  }
}

function mintegralEnd() {
  if (canCall(window, 'gameEnd')) {
    window.gameEnd()
  }
}

const ADAPTERS = {
  preview: { whenReady: startNow, openStore: openInBrowser },
  mraid: { whenReady: mraidWhenReady, openStore: mraidOpen },
  exitapi: { whenReady: startNow, openStore: exitApiOpen },
  dapi: { whenReady: dapiWhenReady, openStore: dapiOpen },
  meta: { whenReady: startNow, openStore: metaOpen },
  mintegral: {
    whenReady: mraidWhenReady,
    openStore: mintegralOpen,
    reportStart: mintegralStart,
    reportEnd: mintegralEnd,
  },
}

const active = ADAPTERS[adapter] || ADAPTERS.preview

/** Runs once the container says the creative may start — or once we give up waiting. */
export function whenReady(callback) {
  let fired = false

  function fire() {
    if (fired) {
      return
    }
    fired = true
    clearTimeout(timer)
    callback()
  }

  const timer = setTimeout(fire, READY_TIMEOUT)
  active.whenReady(fire)
}

/** The one call that sends a player to the store. */
export function openStore() {
  active.openStore()
}

export function reportStart() {
  active.reportStart?.()
}

export function reportEnd() {
  active.reportEnd?.()
}
