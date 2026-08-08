import { Raycaster, Vector2, Vector3 } from 'three'
import { CONFIG } from './config.js'
import { createScene } from './scene.js'
import { KINDS, createBoard } from './board.js'
import { createUi } from './ui.js'
import { createAudio } from '../../../shared/audio.js'
import { createJuice } from '../../../shared/juice.js'
import { openStore, reportEnd, reportStart } from '../../../shared/ads.js'

/** How far a selected item lifts out of its slot. */
const LIFT = 0.34

export function createGame(canvas) {
  const { scene, camera, renderer, trackPerformance, frameContent } = createScene(canvas)

  const board = createBoard(scene)
  const ui = createUi()
  const audio = createAudio()
  const juice = createJuice(scene, CONFIG.juice)

  frameContent(CONFIG.slotsPerShelf * CONFIG.slotWidth + 1.4, board.rackHeight + 1.2)

  const raycaster = new Raycaster()
  const pointer = new Vector2()
  const from = new Vector3()

  let phase = 'ready'
  let selected = null
  /** One move in flight at a time — two would let the player break the board. */
  let flight = null
  let clearTimer = 0
  let movesLeft = CONFIG.moves
  let sortedCount = 0
  let idleTime = 0
  let clockTime = 0
  let lastFrame = 0
  let frameId = 0
  let endcardTimer = 0

  function reset() {
    clearTimeout(endcardTimer)
    board.reset()
    juice.reset()

    selected = null
    board.setSlotHighlight(false)
    flight = null
    clearTimer = 0
    movesLeft = CONFIG.moves
    sortedCount = 0
    idleTime = 0

    ui.setMoves(movesLeft, false)
    ui.setSorted(0, board.kindCount)
    ui.hideEndcard()
  }

  function start() {
    if (phase !== 'ready') {
      return
    }
    phase = 'playing'
    audio.unlock()
    reportStart()
    ui.hideTutorial()
  }

  function finish(won) {
    if (phase === 'over') {
      return
    }
    phase = 'over'
    reportEnd()

    const endcard = won
      ? { title: 'All sorted!', text: `Cleared with ${movesLeft} moves to spare` }
      : { title: 'Out of moves', text: `${sortedCount} of ${board.kindCount} shelves cleared` }

    juice.feedback('large', new Vector3(0, 0, 0), won ? 0x2fd07a : 0xff5d73)

    if (won) {
      audio.win()
    } else {
      audio.lose()
    }

    // Let the shake and sparks land before the endcard covers the screen.
    endcardTimer = setTimeout(() => ui.showEndcard(endcard), CONFIG.endcardDelay * 1000)
  }

  function deselect() {
    if (!selected) {
      return
    }
    selected.mesh.position.copy(selected.slot.position)
    selected = null
    board.setSlotHighlight(false)
  }

  /** Starts an item flying to a free slot. The slot ownership changes at once. */
  function beginMove(item, target) {
    item.slot.item = null
    target.item = item
    item.slot = target

    flight = { item, from: item.mesh.position.clone(), to: target.position, elapsed: 0 }
    selected = null
    board.setSlotHighlight(false)
    board.refreshPads()

    movesLeft -= 1
    ui.setMoves(movesLeft, movesLeft <= 3)
    audio.gem()
  }

  /** Pops a finished shelf and frees its slots. */
  function clearShelf(shelfIndex, kindId) {
    const kind = KINDS.find(item => item.id === kindId)

    for (const slot of board.shelfSlots(shelfIndex)) {
      const item = slot.item
      juice.feedback('small', item.mesh.position, kind.color)
      item.cleared = true
      item.mesh.visible = false
      slot.item = null
    }

    board.refreshPads()
    sortedCount += 1
    ui.setSorted(sortedCount, board.kindCount)
    audio.win()
    juice.feedback('medium', board.shelfSlots(shelfIndex)[1].position, kind.color)

    if (sortedCount >= board.kindCount) {
      finish(true)
    }
  }

  /** Called once a move lands: did that shelf just complete? */
  function settleMove(item) {
    const shelfIndex = item.slot.shelfIndex
    const kindId = board.completedKind(shelfIndex)

    if (kindId) {
      clearTimer = CONFIG.clearDelay
      flight = { pendingShelf: shelfIndex, pendingKind: kindId }
      return
    }

    flight = null
    if (movesLeft <= 0) {
      finish(false)
    }
  }

  function handlePick(clientX, clientY) {
    if (phase === 'over' || flight) {
      return
    }

    start()
    idleTime = 0

    const rect = canvas.getBoundingClientRect()
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(board.pickables(), false)[0]

    if (!hit) {
      deselect()
      return
    }

    const item = hit.object.userData.item
    const slot = hit.object.userData.slot

    if (item) {
      // Tapping the selected item again puts it back down.
      if (selected === item) {
        deselect()
        return
      }
      deselect()
      selected = item
      item.mesh.position.set(item.slot.position.x, item.slot.position.y + LIFT, item.slot.position.z)
      board.setSlotHighlight(true)
      audio.gem()
      return
    }

    if (slot && selected) {
      beginMove(selected, slot)
    }
  }

  function handleTouchStart(event) {
    event.preventDefault()
    handlePick(event.touches[0].clientX, event.touches[0].clientY)
  }

  function handleMouseDown(event) {
    handlePick(event.clientX, event.clientY)
  }

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
  canvas.addEventListener('mousedown', handleMouseDown)

  function updateFlight(delta) {
    if (!flight) {
      return
    }

    // A shelf finished and is waiting to pop.
    if (flight.pendingShelf !== undefined) {
      clearTimer -= delta
      if (clearTimer <= 0) {
        const { pendingShelf, pendingKind } = flight
        flight = null
        clearShelf(pendingShelf, pendingKind)
        if (phase !== 'over' && movesLeft <= 0) {
          finish(false)
        }
      }
      return
    }

    flight.elapsed += delta
    const progress = Math.min(1, flight.elapsed / CONFIG.moveDuration)
    // Ease-out on the way in, plus an arc so the move reads as a throw.
    const eased = 1 - (1 - progress) * (1 - progress)

    from.copy(flight.from).lerp(flight.to, eased)
    from.y += Math.sin(progress * Math.PI) * CONFIG.moveArc
    flight.item.mesh.position.copy(from)

    if (progress >= 1) {
      flight.item.mesh.position.copy(flight.to)
      settleMove(flight.item)
    }
  }

  function tick(now) {
    frameId = requestAnimationFrame(tick)

    // Clamped: a backgrounded WebView hands back a multi-second delta.
    const realDelta = Math.min(0.05, (now - lastFrame) / 1000) || 0
    lastFrame = now

    const frozen = juice.updateFreeze(realDelta)
    const delta = frozen ? 0 : realDelta
    clockTime += delta

    if (phase === 'playing' && !frozen) {
      updateFlight(delta)

      idleTime += delta
      if (idleTime > CONFIG.idleTimeout) {
        finish(false)
      }
    }

    // The selected item hovers, so it is obvious which one is picked up.
    if (selected) {
      const hover = Math.sin(clockTime * 6) * 0.05
      selected.mesh.position.y = selected.slot.position.y + LIFT + hover
    }

    // A slow sway keeps the static board from looking like a screenshot.
    board.group.rotation.y = Math.sin(clockTime * 0.5) * 0.06

    for (const item of board.items) {
      if (!item.cleared) {
        item.mesh.rotation.y = clockTime * 0.4
      }
    }

    juice.update(delta)
    juice.applyShake(camera, realDelta)

    renderer.render(scene, camera)
    trackPerformance(realDelta)
  }

  ui.onCta(openStore)
  ui.onReplay(() => {
    reset()
    ui.hideTutorial()
    phase = 'playing'
  })

  function run() {
    reset()
    lastFrame = performance.now()
    frameId = requestAnimationFrame(tick)
  }

  function dispose() {
    cancelAnimationFrame(frameId)
    clearTimeout(endcardTimer)
    canvas.removeEventListener('touchstart', handleTouchStart)
    canvas.removeEventListener('mousedown', handleMouseDown)
    board.dispose()
    juice.dispose()
    renderer.dispose()
  }

  return { run, dispose }
}
