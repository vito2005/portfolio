<template>
  <div ref="containerRef" class="flex-1 min-h-0 relative w-full overflow-hidden rounded-xl">
    <canvas ref="canvasRef" class="w-full h-full outline-none touch-none" />
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center bg-[#F9F8F6] text-sm text-gray-400"
    >
      Loading font…
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type GUI from 'lil-gui'
import { useLesson } from '@/composables/three-js-lessons/useLesson'
import {
  createKineticText,
  fitCameraToBounds,
  parkLetter,
  updateLetterAppearance,
  type KineticText,
} from '@/composables/three-js-lessons/kineticText'

definePageMeta({
  layout: 'lessons',
})

const route = useRoute()
const url = useRequestURL()
const canonicalUrl = url.origin + route.path

const seoTitle = 'Kinetic Text with Physics — Three.js Lesson | Alex Buki Developer'
const seoDescription
  = 'The scatter-and-settle headline rebuilt on cannon-es: soft LockConstraints hold each letter to its slot, so the tumble comes from where you touched it.'

useHead({
  title: seoTitle,
  meta: [
    { name: 'description', content: seoDescription },
    { property: 'og:type', content: 'article' },
    { property: 'og:title', content: seoTitle },
    { property: 'og:description', content: seoDescription },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:site_name', content: 'Alex Buki Developer' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: seoTitle },
    { name: 'twitter:description', content: seoDescription },
  ],
  link: [{ rel: 'canonical', href: canonicalUrl }],
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)

/**
 * The physics half of a letter. Its Three.js half lives in `kineticText`'s
 * `KineticLetter`, and the two are paired by index.
 */
interface PhysicsLetter {
  body: CANNON.Body
  /** Massless body parked in the slot; the constraint pulls `body` back to it. */
  anchor: CANNON.Body
  constraint: CANNON.LockConstraint
  restPosition: CANNON.Vec3
}

// Three.js and cannon handles are plain `let` — wrapping them in `ref()` puts a
// reactive proxy around the object graph, which breaks internal identity checks.
let animationId = 0
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let gui: GUI | null = null
let kineticText: KineticText | null = null
let world: CANNON.World | null = null
let bodies: PhysicsLetter[] = []
let disposeLesson: (() => void) | null = null
let detachListeners: (() => void) | null = null

type FontName = 'Sora' | 'Helvetiker'

const FONT_URLS: Record<FontName, string> = {
  Sora: '/fonts/Sora_Regular.json',
  Helvetiker: '/fonts/helvetiker_regular.typeface.json',
}

const fonts: Record<FontName, Font | null> = {
  Sora: null,
  Helvetiker: null,
}

/** Multiple of the glyph size — the reference headline sits fairly tight. */
const LINE_HEIGHT = 1.25

/** The site's page colour. Resting letters fade their sides into it to vanish. */
const PAGE_BACKGROUND = '#F9F8F6'

/** cannon's own fixed timestep. SPOOK parameters are tuned against it. */
const PHYSICS_STEP = 1 / 60

const parameters = {
  // lil-gui has no multiline input, so `|` stands in for a line break.
  text: 'MADE TO|MOVE',
  font: 'Helvetiker' as FontName,
  fov: 14,
  size: 1,
  depth: 0.22,
  letterSpacing: 0.02,
  /**
   * SPOOK stiffness of the constraint holding a letter to its slot. cannon's
   * default is 1e7 — rigid enough to snap a letter home in one frame. Dropping
   * it by five orders of magnitude turns the same constraint into a spring.
   */
  stiffness: 22,
  /** SPOOK relaxation: how many steps the solver may take to fix the error. */
  relaxation: 4,
  /** Angular drag. Low, or the constraint and the drag between them kill the
   * tumble before it is visible. */
  angularDamping: 0.08,
  impulse: 7,
  /**
   * Torque that turns a letter face-on again as it nears its slot.
   *
   * The LockConstraint alone cannot do this: its three RotationalEquations cap
   * out at 90° (`maxAngle = PI/2`) and align axes by dot product, so a letter
   * flipped 180° sits in a second, equally valid equilibrium — upside down, and
   * perfectly happy there. This is the physics version of lesson 50's
   * `flatten`, and the clearest place where the solver needs help.
   */
  align: 9,
  bounce: 0.2,
  shadowStrength: 0.85,
  shadows: true,
  orbit: false,
}

onMounted(() => {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) {
    return
  }

  const lesson = useLesson(canvasRef, containerRef, { antialias: true })
  const { camera, scene } = lesson

  renderer = lesson.renderer
  controls = lesson.controls
  gui = lesson.gui
  disposeLesson = lesson.disposeLesson

  gui.domElement.style.position = 'absolute'
  gui.domElement.style.top = '0'
  gui.domElement.style.right = '0'

  scene.background = new THREE.Color(PAGE_BACKGROUND)

  camera.fov = parameters.fov
  camera.updateProjectionMatrix()
  controls.enabled = parameters.orbit

  /**
   * Physics world
   *
   * No gravity: the letters belong in a line, not on the floor. That is the
   * first sign this is not what a rigid-body solver is built for — the thing it
   * exists to do has to be switched off.
   */
  world = new CANNON.World()
  world.gravity.set(0, 0, 0)
  world.broadphase = new CANNON.SAPBroadphase(world)
  // Letters are parked by hand once they are close enough to their slot; left
  // to cannon they would fall asleep wherever the solver happened to leave
  // them, which is never quite flat.
  world.allowSleep = false

  const letterPhysicsMaterial = new CANNON.Material('letter')
  world.defaultContactMaterial = new CANNON.ContactMaterial(
    letterPhysicsMaterial,
    letterPhysicsMaterial,
    { friction: 0, restitution: parameters.bounce },
  )

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let isPointerOverCanvas = false
  // Knocks follow pointer *movement*, never the clock: the ray is cast every
  // frame, so a parked cursor would keep shoving whatever sits under it.
  let hasPointerMoved = false
  let hoveredLetters = new Set<number>()
  let nextHoveredLetters = new Set<number>()

  const applySpookParams = (constraint: CANNON.LockConstraint) => {
    // Every equation in a constraint carries its own SPOOK parameters, and a
    // LockConstraint is four of them: one point-to-point for position, three
    // rotational for orientation. Softening all four is what turns "weld this
    // letter to its slot" into "pull it back there".
    for (const equation of constraint.equations) {
      equation.setSpookParams(parameters.stiffness, parameters.relaxation, PHYSICS_STEP)
    }
  }

  const clearBodies = () => {
    for (const entry of bodies) {
      world?.removeConstraint(entry.constraint)
      world?.removeBody(entry.body)
      world?.removeBody(entry.anchor)
    }
    bodies = []
  }

  const fitCameraToText = () => {
    if (kineticText) {
      fitCameraToBounds(camera, kineticText.bounds, 1.28)
      controls?.target.set(0, 0, 0)
      controls?.update()
    }
  }

  const rebuildText = () => {
    const font = fonts[parameters.font]
    if (!font || !world) {
      return
    }

    clearBodies()
    kineticText?.dispose()
    kineticText = createKineticText(parameters.text.split('|'), font, {
      size: parameters.size,
      depth: parameters.depth,
      lineHeight: LINE_HEIGHT,
      letterSpacing: parameters.letterSpacing,
      bevel: false,
      appearance: { kind: 'flat', backgroundColor: PAGE_BACKGROUND },
      shadow: { strength: parameters.shadowStrength },
    })
    kineticText.setShadowsVisible(parameters.shadows)
    scene.add(kineticText.group)

    for (const letter of kineticText.letters) {
      const rest = new CANNON.Vec3(
        letter.restPosition.x,
        letter.restPosition.y,
        letter.restPosition.z,
      )

      // A box round the glyph. cannon cannot collide two concave shapes, and
      // every letter with a counter or a crossbar is concave — so this is the
      // ceiling on contact accuracy here, not a shortcut. It is still a better
      // fit than the circles the hand-rolled version uses.
      const half = new CANNON.Vec3(
        Math.max(letter.hitbox.scale.x / 2 / 1.08, 0.01),
        Math.max(letter.hitbox.scale.y / 2 / 1.08, 0.01),
        Math.max(parameters.depth / 2, 0.01),
      )

      const body = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Box(half),
        material: letterPhysicsMaterial,
        position: rest.clone(),
        angularDamping: parameters.angularDamping,
      })
      world.addBody(body)

      // The anchor never moves and never collides — it exists purely as the
      // other end of the constraint. A Particle shape keeps its AABB valid
      // while the zeroed collision filters keep it out of the broadphase.
      const anchor = new CANNON.Body({
        mass: 0,
        type: CANNON.Body.STATIC,
        shape: new CANNON.Particle(),
        position: rest.clone(),
        collisionFilterGroup: 0,
        collisionFilterMask: 0,
      })
      world.addBody(anchor)

      // Built while the letter sits in its slot, so the relative transform the
      // constraint captures *is* the rest pose — position and orientation both.
      const constraint = new CANNON.LockConstraint(body, anchor)
      applySpookParams(constraint)
      world.addConstraint(constraint)

      bodies.push({ body, anchor, constraint, restPosition: rest })
    }

    fitCameraToText()
    isLoading.value = false
  }

  /**
   * Pointer position is normalised against the canvas rect, not the window —
   * the canvas is an inset box inside the lessons layout.
   */
  const handlePointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    if (x !== pointer.x || y !== pointer.y) {
      hasPointerMoved = true
    }

    pointer.set(x, y)
    isPointerOverCanvas = true
  }

  const handlePointerLeave = () => {
    isPointerOverCanvas = false
    hoveredLetters.clear()
  }

  const handleResize = () => {
    fitCameraToText()
  }

  canvas.addEventListener('pointermove', handlePointerMove)
  canvas.addEventListener('pointerdown', handlePointerMove)
  canvas.addEventListener('pointerleave', handlePointerLeave)
  window.addEventListener('resize', handleResize)

  detachListeners = () => {
    canvas.removeEventListener('pointermove', handlePointerMove)
    canvas.removeEventListener('pointerdown', handlePointerMove)
    canvas.removeEventListener('pointerleave', handlePointerLeave)
    window.removeEventListener('resize', handleResize)
  }

  const knock = (entry: PhysicsLetter, contactPoint: THREE.Vector3) => {
    const push = new CANNON.Vec3(
      entry.body.position.x - contactPoint.x,
      entry.body.position.y - contactPoint.y,
      0,
    )

    // A hit dead-centre gives no direction at all — pick one.
    if (push.lengthSquared() < 1e-6) {
      push.set(Math.random() - 0.5, Math.random() - 0.5, 0)
    }
    push.normalize()
    // Towards the viewer, so the coloured extrusion turns into shot.
    push.z = 0.45
    push.scale(parameters.impulse, push)

    // The lever arm is the whole point of doing this with a solver: the impulse
    // lands where the ray hit, offset from the centre of mass, so the tumble is
    // a consequence of *where* you touched the letter. Lesson 50 has to fake
    // that with a random angular velocity.
    const lever = new CANNON.Vec3(
      contactPoint.x - entry.body.position.x,
      contactPoint.y - entry.body.position.y,
      contactPoint.z - entry.body.position.z,
    )

    entry.body.wakeUp()
    entry.body.applyImpulse(push, lever)
  }

  for (const name of Object.keys(FONT_URLS) as FontName[]) {
    lesson.fontLoader.load(
      FONT_URLS[name],
      (font) => {
        fonts[name] = font
        if (parameters.font === name) {
          rebuildText()
        }
      },
      undefined,
      () => {
        // A failed font must still clear the overlay, or it hangs forever.
        isLoading.value = false
      },
    )
  }

  /**
   * GUI
   */
  const textFolder = gui.addFolder('Text')
  textFolder.add(parameters, 'text').name('Text ( | = line break)').onFinishChange(rebuildText)
  textFolder.add(parameters, 'font', Object.keys(FONT_URLS)).name('Font').onChange(rebuildText)
  textFolder.add(parameters, 'size').min(0.4).max(2).step(0.05).name('Size').onFinishChange(rebuildText)
  textFolder.add(parameters, 'depth').min(0.05).max(0.8).step(0.01).name('Depth').onFinishChange(rebuildText)
  textFolder.add(parameters, 'letterSpacing').min(-0.1).max(0.4).step(0.01).name('Tracking').onFinishChange(rebuildText)

  const constraintFolder = gui.addFolder('Constraint')
  constraintFolder.add(parameters, 'stiffness').min(2).max(300).step(1).name('Stiffness').onChange(() => {
    for (const entry of bodies) {
      applySpookParams(entry.constraint)
    }
  })
  constraintFolder.add(parameters, 'relaxation').min(1).max(20).step(0.5).name('Relaxation').onChange(() => {
    for (const entry of bodies) {
      applySpookParams(entry.constraint)
    }
  })
  constraintFolder.add(parameters, 'angularDamping').min(0).max(1).step(0.01).name('Angular damping').onChange((value: number) => {
    for (const entry of bodies) {
      entry.body.angularDamping = value
    }
  })
  constraintFolder.add(parameters, 'align').min(0).max(30).step(0.5).name('Align torque')
  constraintFolder.add(parameters, 'impulse').min(0).max(25).step(0.5).name('Impulse')
  constraintFolder.add(parameters, 'bounce').min(0).max(1).step(0.05).name('Bounce').onChange((value: number) => {
    if (world) {
      world.defaultContactMaterial.restitution = value
    }
  })

  const lookFolder = gui.addFolder('Look')
  lookFolder.add(parameters, 'shadows').name('Shadows').onChange((value: boolean) => {
    kineticText?.setShadowsVisible(value)
  })
  lookFolder.add(parameters, 'shadowStrength').min(0).max(1).step(0.05).name('Shadow strength').onChange((value: number) => {
    kineticText?.setShadowStrength(value)
  })
  lookFolder.add(parameters, 'fov').min(2).max(40).step(1).name('Camera FOV').onChange((value: number) => {
    camera.fov = value
    camera.updateProjectionMatrix()
    fitCameraToText()
  })
  lookFolder.add(parameters, 'orbit').name('Orbit camera').onChange((value: boolean) => {
    if (controls) {
      controls.enabled = value
    }
  })
  lookFolder.close()

  /**
   * Animate
   */
  const clock = new THREE.Clock()
  const alignTorque = new CANNON.Vec3()

  const tick = () => {
    // A backgrounded tab hands back a delta of several seconds on return;
    // capping the catch-up keeps cannon from burning a hundred sub-steps.
    const delta = Math.min(clock.getDelta(), 1 / 30)

    if (kineticText && isPointerOverCanvas && hasPointerMoved) {
      hasPointerMoved = false
      raycaster.setFromCamera(pointer, camera)

      nextHoveredLetters.clear()
      for (const intersection of raycaster.intersectObjects(kineticText.hitboxes, false)) {
        const index = intersection.object.userData.letterIndex as number
        nextHoveredLetters.add(index)

        const entry = bodies[index]
        if (entry && !hoveredLetters.has(index)) {
          knock(entry, intersection.point)
        }
      }

      const previousHovered = hoveredLetters
      hoveredLetters = nextHoveredLetters
      nextHoveredLetters = previousHovered
    }
    else if (!isPointerOverCanvas && hoveredLetters.size > 0) {
      hoveredLetters.clear()
    }

    // Applied before the step, while the solver is still collecting forces.
    if (kineticText) {
      const settleRadius = parameters.size * 1.6

      for (const entry of bodies) {
        const { quaternion } = entry.body

        // Flip to the shortest arc: q and -q are the same orientation, but only
        // one of them points the correction the short way round.
        let { x, y, z, w } = quaternion
        if (w < 0) {
          x = -x
          y = -y
          z = -z
          w = -w
        }

        const axisLength = Math.hypot(x, y, z)
        if (axisLength < 1e-6) {
          continue
        }

        // Ramped by proximity, exactly like lesson 50: a letter in mid-flight
        // is left alone to tumble, and only gets straightened on the way home.
        const offset = entry.body.position.distanceTo(entry.restPosition)
        const settle = 1 - Math.min(offset / settleRadius, 1)
        if (settle <= 0) {
          continue
        }

        const angle = 2 * Math.atan2(axisLength, w)
        const scale = (-parameters.align * settle * angle) / axisLength
        alignTorque.set(x * scale, y * scale, z * scale)
        entry.body.applyTorque(alignTorque)
      }
    }

    world?.step(PHYSICS_STEP, delta, 3)

    if (kineticText) {
      const settleRadius = parameters.size * 1.6

      for (const [index, entry] of bodies.entries()) {
        const letter = kineticText.letters[index]
        if (!letter) {
          continue
        }

        const { position, quaternion, velocity } = entry.body
        const offset = position.distanceTo(entry.restPosition)
        // Quaternion angle from identity, without building a THREE.Quaternion
        // just to ask: 2·acos(|w|) is the rotation the letter is carrying.
        const tilt = 2 * Math.acos(Math.min(Math.abs(quaternion.w), 1))

        // A soft constraint never truly converges — it hovers a hair off the
        // slot forever. Park the letter by hand once the error is invisible,
        // otherwise the "flat text at rest" trick never quite lands. This is
        // the cost of doing it with a solver, and worth being honest about.
        if (offset < 0.004 && velocity.lengthSquared() < 1e-4 && tilt < 0.01) {
          entry.body.position.copy(entry.restPosition)
          entry.body.quaternion.set(0, 0, 0, 1)
          entry.body.velocity.setZero()
          entry.body.angularVelocity.setZero()
          parkLetter(letter)
          continue
        }

        letter.mesh.position.set(position.x, position.y, position.z)
        letter.mesh.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w)
        letter.hitbox.position.copy(letter.mesh.position)

        // Same two cues as lesson 50, so both versions read identically: speed
        // alone blinks out at the top of the arc, travel alone lags the hit.
        const speedCue = velocity.length() / (parameters.impulse * 0.35)
        const travelCue = offset / (settleRadius * 0.5)
        updateLetterAppearance(letter, Math.min(Math.max(speedCue, travelCue), 1))
      }
    }

    if (controls?.enabled) {
      controls.update()
    }

    renderer?.render(scene, camera)
    animationId = window.requestAnimationFrame(tick)
  }

  tick()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  detachListeners?.()
  gui?.destroy()
  controls?.dispose()
  kineticText?.dispose()
  // cannon has no dispose; dropping the references is the teardown.
  bodies = []
  world = null
  disposeLesson?.()
  renderer?.dispose()
})
</script>
