import {
  Color,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  Vector3,
} from 'three'
import { CONFIG } from './config.js'
import { createRadialTexture } from '../../../shared/textures.js'

const BLACK = new Color(0x000000)
const HIT_FLASH = new Color(0xff3355)

/** Volume-conserving squash on impact, before it springs back. */
const SQUASH_X = 1.35
const SQUASH_Y = 0.62

/** Overshoots past the target and settles — a linear return looks mechanical. */
function easeOutBack(progress) {
  const overshoot = 1.70158
  const shifted = progress - 1
  return 1 + (overshoot + 1) * shifted * shifted * shifted + overshoot * shifted * shifted
}

/** Blob shadow: a real shadow map would cost far more frame time than it is worth. */
const SHADOW_STOPS = [
  [0, 'rgba(0, 0, 0, 0.5)'],
  [0.6, 'rgba(0, 0, 0, 0.18)'],
  [1, 'rgba(0, 0, 0, 0)'],
]

/**
 * The marble and the camera trailing it. Clamped inside the rails, so there is
 * no gravity and no falling — the only way to lose is to hit something.
 */
export function createPlayer(scene) {
  const geometry = new IcosahedronGeometry(CONFIG.marbleRadius, 1)
  const material = new MeshLambertMaterial({ color: 0xffd166, flatShading: true })
  const mesh = new Mesh(geometry, material)

  // Squash lives on an unrotated parent: scaling the rolling mesh directly
  // would make the squash tumble along with it.
  const group = new Object3D()
  group.add(mesh)
  scene.add(group)

  const shadowTexture = createRadialTexture(64, SHADOW_STOPS)
  const shadowGeometry = new PlaneGeometry(1.2, 1.2)
  const shadowMaterial = new MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
  })
  const shadow = new Mesh(shadowGeometry, shadowMaterial)
  shadow.rotation.x = -Math.PI / 2
  scene.add(shadow)

  const position = new Vector3()
  const axisX = new Vector3(1, 0, 0)
  const axisZ = new Vector3(0, 0, 1)
  const cameraPosition = new Vector3()
  const cameraTarget = new Vector3()

  let speed = CONFIG.speedStart
  let squashTime = Infinity
  let started = false
  let invulnerable = false
  let invulnerableTime = 0

  function reset(startZ) {
    position.set(0, CONFIG.marbleRadius, startZ)
    group.position.copy(position)
    group.scale.set(1, 1, 1)
    mesh.quaternion.identity()
    material.emissive.copy(BLACK)
    speed = CONFIG.speedStart
    squashTime = Infinity
    started = false
    invulnerable = false
    invulnerableTime = 0
  }

  /** Pulses while the marble is phasing through whatever it just hit. */
  function setInvulnerable(active) {
    if (active && !invulnerable) {
      invulnerableTime = 0
    }
    invulnerable = active
  }

  function update(delta, steer) {
    speed = Math.min(CONFIG.speedMax, speed + CONFIG.speedRamp * delta)

    const previousX = position.x
    position.z -= speed * delta

    const target = Math.max(-1, Math.min(1, steer)) * CONFIG.steerRange
    // Exponential smoothing: identical whether the device runs at 60 or 30 fps.
    position.x += (target - position.x) * (1 - Math.exp(-CONFIG.steerLerp * delta))

    group.position.copy(position)
    // Rolled by the distance actually travelled on each axis.
    mesh.rotateOnWorldAxis(axisX, (speed * delta) / CONFIG.marbleRadius)
    mesh.rotateOnWorldAxis(axisZ, -(position.x - previousX) / CONFIG.marbleRadius)

    shadow.position.set(position.x, 0.015, position.z)

    updateSquash(delta)

    if (invulnerable) {
      // Keeps glowing while intangible, so passing through a wall reads as a
      // rule rather than a glitch.
      invulnerableTime += delta
      const pulse = 0.3 + 0.22 * Math.sin(invulnerableTime * 26)
      material.emissive.setRGB(pulse, pulse * 0.18, pulse * 0.22)
    } else {
      material.emissive.lerp(BLACK, 1 - Math.exp(-7 * delta))
    }

    started = true
  }

  /** Springs back from the impact squash, overshooting slightly on the way. */
  function updateSquash(delta) {
    if (squashTime > CONFIG.juice.squashDuration) {
      return
    }

    squashTime += delta
    const progress = Math.min(1, squashTime / CONFIG.juice.squashDuration)
    const eased = easeOutBack(progress)

    group.scale.x = SQUASH_X + (1 - SQUASH_X) * eased
    group.scale.y = SQUASH_Y + (1 - SQUASH_Y) * eased
    group.scale.z = group.scale.x

    if (progress >= 1) {
      group.scale.set(1, 1, 1)
      squashTime = Infinity
    }
  }

  function knockBack() {
    position.z += CONFIG.hitKnockback
    speed = CONFIG.speedStart * 0.65
    material.emissive.copy(HIT_FLASH)
    group.scale.set(SQUASH_X, SQUASH_Y, SQUASH_X)
    squashTime = 0
  }

  function updateCamera(camera, delta) {
    // Looks a long way ahead: the next obstacle has to be readable a second early.
    cameraPosition.set(position.x * 0.4, 3.15, position.z + 5.6)
    cameraTarget.set(position.x * 0.45, 0.2, position.z - 5.5)

    if (started) {
      camera.position.lerp(cameraPosition, 1 - Math.exp(-6 * delta))
    } else {
      camera.position.copy(cameraPosition)
    }

    // Shake is added by `juice.applyShake` after this, so it survives lookAt.
    camera.lookAt(cameraTarget)
  }

  function dispose() {
    geometry.dispose()
    material.dispose()
    shadowGeometry.dispose()
    shadowMaterial.dispose()
    shadowTexture.dispose()
  }

  return {
    mesh,
    position,
    reset,
    update,
    knockBack,
    setInvulnerable,
    updateCamera,
    dispose,
    get speed() {
      return speed
    },
    /** 0 at the starting speed, 1 at the cap — drives the field-of-view kick. */
    get speedRatio() {
      return (speed - CONFIG.speedStart) / (CONFIG.speedMax - CONFIG.speedStart)
    },
  }
}
