import { CONFIG } from './config.js'
import { createScene } from './scene.js'
import { COLORS, createLevel } from './level.js'
import { createPlayer } from './player.js'
import { createInput } from '../../../shared/input.js'
import { createUi } from './ui.js'
import { createAudio } from '../../../shared/audio.js'
import { createJuice } from '../../../shared/juice.js'
import { sphereHitsBox } from '../../../shared/collision.js'
import { openStore, reportEnd, reportStart } from '../../../shared/ads.js'

/** Only obstacles this close to the marble are worth a collision test. */
const COLLISION_RANGE = 2.5

export function createGame(canvas) {
  const { scene, camera, renderer, trackPerformance, setFovOffset } = createScene(canvas)

  const level = createLevel()
  scene.add(level.group)

  const player = createPlayer(scene)
  const input = createInput(canvas)
  const ui = createUi()
  const audio = createAudio()
  const juice = createJuice(scene, CONFIG.juice)

  const runLength = level.startZ - level.finishZ

  let phase = 'ready'
  let livesLeft = CONFIG.lives
  let gemsCollected = 0
  let grace = 0
  let runTime = 0
  let clockTime = 0
  let lastFrame = 0
  let frameId = 0
  let endcardTimer = 0

  function reset() {
    player.reset(level.startZ)
    input.reset()
    juice.reset()
    level.resetRun()
    clearTimeout(endcardTimer)

    livesLeft = CONFIG.lives
    gemsCollected = 0
    grace = 0
    runTime = 0

    ui.setLives(livesLeft)
    ui.setGems(0)
    ui.setProgress(0)
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
      ? {
          title: 'You made it!',
          text: gemsCollected === level.totalGems
            ? 'Every single gem. Flawless.'
            : `${gemsCollected} of ${level.totalGems} gems collected`,
        }
      : { title: 'So close!', text: 'The full game has 120 levels waiting' }

    juice.feedback('large', player.position, won ? COLORS.finish : COLORS.obstacle)

    if (won) {
      audio.win()
    } else {
      audio.lose()
    }

    // Let the shake and sparks land before the endcard covers the screen.
    endcardTimer = setTimeout(() => ui.showEndcard(endcard), CONFIG.endcardDelay * 1000)
  }

  function checkObstacles() {
    if (grace > 0) {
      return
    }

    for (const obstacle of level.obstacles) {
      // Element 14 is the world Z — cheaper than allocating a Vector3 per obstacle.
      const distance = obstacle.mesh.matrixWorld.elements[14] - player.position.z
      if (distance > COLLISION_RANGE || distance < -COLLISION_RANGE) {
        continue
      }

      if (!sphereHitsBox(obstacle.mesh, player.position, CONFIG.marbleRadius)) {
        continue
      }

      const alreadyPaidFor = obstacle.hits > 0
      obstacle.hits += 1

      player.knockBack()
      audio.hit()
      grace = CONFIG.hitGrace

      // A wall stays a wall — ram it again and it bounces you again. But each
      // obstacle can only ever cost one life, so grinding against one cannot
      // end the run in two seconds.
      if (alreadyPaidFor) {
        juice.feedback('small', player.position, COLORS.obstacle)
        return
      }

      livesLeft -= 1
      ui.setLives(Math.max(0, livesLeft))

      if (livesLeft <= 0) {
        // `finish` fires the large tier; a medium one on top would double up.
        finish(false)
      } else {
        juice.feedback('medium', player.position, COLORS.obstacle)
      }
      return
    }
  }

  function checkGems() {
    for (const gem of level.gems) {
      if (gem.collected) {
        continue
      }

      const dz = gem.mesh.position.z - player.position.z
      if (dz > 1 || dz < -1) {
        continue
      }

      const dx = gem.mesh.position.x - player.position.x
      if (dx * dx + dz * dz < CONFIG.gemPickupRadius * CONFIG.gemPickupRadius) {
        // Left in the scene: `level.update` plays the pop before hiding it.
        gem.collected = true
        gem.pop = 0
        gemsCollected += 1
        ui.setGems(gemsCollected)
        audio.gem()
        juice.feedback('small', gem.mesh.position, COLORS.gem)
      }
    }
  }

  function tick(now) {
    frameId = requestAnimationFrame(tick)

    // Clamped: a backgrounded WebView hands back a multi-second delta, which
    // would teleport the marble straight through an obstacle.
    const realDelta = Math.min(0.05, (now - lastFrame) / 1000) || 0
    lastFrame = now

    // Hit-stop: gameplay gets a zero delta while the loop keeps rendering.
    const frozen = juice.updateFreeze(realDelta)
    const delta = frozen ? 0 : realDelta
    clockTime += delta

    level.update(clockTime, delta)
    input.update(realDelta)

    if (phase === 'playing' && !frozen) {
      runTime += delta
      grace = Math.max(0, grace - delta)
      player.setInvulnerable(grace > 0)

      player.update(delta, input.state.value)
      checkObstacles()
      checkGems()

      ui.setProgress((level.startZ - player.position.z) / runLength)

      if (player.position.z <= level.finishZ) {
        finish(true)
      } else if (runTime > CONFIG.idleTimeout) {
        // Player put the phone down mid-run — show the offer rather than nothing.
        finish(false)
      }
    }

    juice.update(delta)
    player.updateCamera(camera, delta)
    // Applied after lookAt, so the shake is not overwritten by the camera aim.
    juice.applyShake(camera, realDelta)
    setFovOffset(player.speedRatio * CONFIG.juice.fovKick)

    renderer.render(scene, camera)
    trackPerformance(realDelta)
  }

  input.firstInput = start
  ui.onCta(openStore)
  ui.onReplay(() => {
    reset()
    // A replay can happen before the player ever touched the screen — if the
    // idle timeout ended the first run, the tutorial would still be up.
    ui.hideTutorial()
    phase = 'playing'
  })

  function run() {
    reset()
    player.updateCamera(camera, 0)
    lastFrame = performance.now()
    frameId = requestAnimationFrame(tick)
  }

  function dispose() {
    cancelAnimationFrame(frameId)
    clearTimeout(endcardTimer)
    input.dispose()
    level.dispose()
    player.dispose()
    juice.dispose()
    renderer.dispose()
  }

  return { run, dispose }
}
