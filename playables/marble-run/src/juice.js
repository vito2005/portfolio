import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  PointsMaterial,
} from 'three'
import { CONFIG } from './config.js'
import { createRadialTexture } from './textures.js'

/** Ring buffer: two large bursts fit, and nothing is allocated while playing. */
const MAX_PARTICLES = 80

const PARKED_Y = -999

const SPARK_STOPS = [
  [0, 'rgba(255, 255, 255, 1)'],
  [0.4, 'rgba(255, 255, 255, 0.55)'],
  [1, 'rgba(255, 255, 255, 0)'],
]

/** Continuous in time — a fresh `Math.random()` per frame buzzes like static. */
function shakeNoise(time, seed) {
  return 0.6 * Math.sin(time * 1.1 + seed) + 0.4 * Math.sin(time * 2.3 + seed * 2)
}

/** Camera trauma, hit-stop and sparks. Never touches gameplay state. */
export function createJuice(scene) {
  /* Particles */

  const positions = new Float32Array(MAX_PARTICLES * 3)
  const colors = new Float32Array(MAX_PARTICLES * 3)
  const velocities = new Float32Array(MAX_PARTICLES * 3)
  const tint = new Float32Array(MAX_PARTICLES * 3)
  const life = new Float32Array(MAX_PARTICLES)
  const span = new Float32Array(MAX_PARTICLES)

  /** Sends a spark out of sight; black is invisible under additive blending. */
  function park(index) {
    positions[index * 3 + 1] = PARKED_Y
    colors[index * 3] = 0
    colors[index * 3 + 1] = 0
    colors[index * 3 + 2] = 0
  }

  for (let index = 0; index < MAX_PARTICLES; index += 1) {
    park(index)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('color', new BufferAttribute(colors, 3))

  const sparkTexture = createRadialTexture(32, SPARK_STOPS)
  const material = new PointsMaterial({
    size: 0.21,
    map: sparkTexture,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })

  const points = new Points(geometry, material)
  // Sparks live in world space; culling the container would blink them out.
  points.frustumCulled = false
  scene.add(points)

  const burstColor = new Color()
  let cursor = 0

  function burst(position, color, count) {
    burstColor.set(color)

    for (let index = 0; index < count; index += 1) {
      const slot = cursor
      cursor = (cursor + 1) % MAX_PARTICLES

      const angle = Math.random() * Math.PI * 2

      // On a shell, not at the centre — sparks born inside the marble stay hidden.
      const radius = 0.3 + Math.random() * 0.22
      positions[slot * 3] = position.x + Math.cos(angle) * radius
      positions[slot * 3 + 1] = position.y + 0.12 + Math.random() * 0.3
      positions[slot * 3 + 2] = position.z + Math.sin(angle) * radius

      // Biased upward so debris arcs instead of spraying flat.
      const speed = 1.8 + Math.random() * 2.4
      velocities[slot * 3] = Math.cos(angle) * speed
      velocities[slot * 3 + 1] = 1.6 + Math.random() * 2.8
      velocities[slot * 3 + 2] = Math.sin(angle) * speed

      tint[slot * 3] = burstColor.r
      tint[slot * 3 + 1] = burstColor.g
      tint[slot * 3 + 2] = burstColor.b

      span[slot] = 0.35 + Math.random() * 0.35
      life[slot] = span[slot]
    }
  }

  function updateParticles(delta) {
    let alive = false

    for (let index = 0; index < MAX_PARTICLES; index += 1) {
      if (life[index] <= 0) {
        continue
      }

      life[index] -= delta

      if (life[index] <= 0) {
        park(index)
        alive = true
        continue
      }

      velocities[index * 3 + 1] -= 9 * delta
      positions[index * 3] += velocities[index * 3] * delta
      positions[index * 3 + 1] += velocities[index * 3 + 1] * delta
      positions[index * 3 + 2] += velocities[index * 3 + 2] * delta

      // Fading to black is the fade-out — no per-point alpha channel needed.
      const remaining = life[index] / span[index]
      colors[index * 3] = tint[index * 3] * remaining
      colors[index * 3 + 1] = tint[index * 3 + 1] * remaining
      colors[index * 3 + 2] = tint[index * 3 + 2] * remaining
      alive = true
    }

    if (alive) {
      geometry.attributes.position.needsUpdate = true
      geometry.attributes.color.needsUpdate = true
    }
  }

  /* Camera trauma */

  let trauma = 0
  let shakeTime = 0

  /** Runs on the real delta, so the shake keeps decaying through a hit-stop. */
  function applyShake(camera, realDelta) {
    if (trauma <= 0) {
      return
    }

    trauma = Math.max(0, trauma - CONFIG.juice.traumaDecay * realDelta)
    // Squared: small events barely nudge the screen, big ones punch.
    const strength = trauma * trauma
    shakeTime += realDelta * 30

    camera.position.x += CONFIG.juice.maxShake * strength * shakeNoise(shakeTime, 0)
    camera.position.y += CONFIG.juice.maxShake * 0.7 * strength * shakeNoise(shakeTime, 1.7)
    camera.rotation.z += CONFIG.juice.maxRoll * strength * shakeNoise(shakeTime, 3.1)
  }

  /* Hit-stop */

  let freezeTimer = 0

  /** Counts down on the real delta — a frozen delta would never expire. */
  function updateFreeze(realDelta) {
    const frozen = freezeTimer > 0
    freezeTimer = Math.max(0, freezeTimer - realDelta)
    return frozen
  }

  /** One call per event: the tier decides how hard everything hits. */
  function feedback(tier, position, color) {
    const preset = CONFIG.juice[tier]

    // Trauma accumulates rather than resetting, so two quick hits read as one big one.
    trauma = Math.min(1, trauma + preset.trauma)

    if (preset.freeze > 0) {
      freezeTimer = Math.max(freezeTimer, preset.freeze)
    }
    if (preset.particles > 0) {
      burst(position, color, preset.particles)
    }
  }

  function reset() {
    trauma = 0
    freezeTimer = 0
    for (let index = 0; index < MAX_PARTICLES; index += 1) {
      life[index] = 0
      park(index)
    }
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
  }

  function dispose() {
    geometry.dispose()
    material.dispose()
    sparkTexture.dispose()
  }

  return { feedback, applyShake, updateFreeze, update: updateParticles, reset, dispose }
}
