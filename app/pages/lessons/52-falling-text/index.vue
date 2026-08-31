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
import { layoutGlyphs, type LaidOutGlyph } from '@/composables/three-js-lessons/kineticText'

definePageMeta({
  layout: 'lessons',
})

const route = useRoute()
const url = useRequestURL()
const canonicalUrl = url.origin + route.path

const seoTitle = 'Falling Text — Three.js Lesson | Alex Buki Developer'
const seoDescription
  = 'Rigid-body typography with Three.js and cannon-es: each letter is a physics body that drops, tumbles and piles up when the pointer knocks it loose.'

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
 * One letter: the mesh you see, the body that decides where it goes, and the
 * rest transform we need in order to put it back on Reset.
 *
 * Unlike the spring lessons there is no per-frame state here at all — cannon
 * owns the motion, and the tick just copies body → mesh.
 */
interface FallingLetter {
  mesh: THREE.Mesh
  body: CANNON.Body
  /** Invisible pointer target; follows the body but never its rotation. */
  hitbox: THREE.Mesh
  restPosition: CANNON.Vec3
}

// Three.js and cannon handles are plain `let` — wrapping them in `ref()` puts a
// reactive proxy around the object graph, which breaks internal identity checks.
let animationId = 0
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let gui: GUI | null = null
let world: CANNON.World | null = null
let letters: FallingLetter[] = []
let glyphs: LaidOutGlyph[] = []
let letterMaterial: THREE.MeshStandardMaterial | null = null
let floorMesh: THREE.Mesh | null = null
let disposeLesson: (() => void) | null = null
let detachListeners: (() => void) | null = null
let hitSound: HTMLAudioElement | null = null
let hitboxGeometry: THREE.BoxGeometry | null = null

type FontName = 'Sora' | 'Helvetiker'

const FONT_URLS: Record<FontName, string> = {
  Sora: '/fonts/Sora_Regular.json',
  Helvetiker: '/fonts/helvetiker_regular.typeface.json',
}

const fonts: Record<FontName, Font | null> = {
  Sora: null,
  Helvetiker: null,
}

/** Multiple of the glyph size. */
const LINE_HEIGHT = 1.3

/** How far below the headline the ground sits, in glyph sizes. */
const FLOOR_DROP = 1.5

/**
 * Below this impact speed a contact is a scrape, not a hit. Without a gate the
 * whole pile chatters as it settles and the sound turns into a buzz.
 */
const HIT_SOUND_THRESHOLD = 1.5

const parameters = {
  // lil-gui has no multiline input, so `|` stands in for a line break.
  text: 'FALL|DOWN',
  font: 'Helvetiker' as FontName,
  size: 0.9,
  depth: 0.3,
  letterSpacing: 0.02,
  gravity: 9.82,
  restitution: 0.3,
  friction: 0.35,
  // Deliberately gentle: the point is that gravity does the work. A hard shove
  // sends letters skidding out of frame before they ever hit the floor.
  impulse: 1.2,
  sound: true,
  reset: () => {},
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

  scene.background = new THREE.Color('#F9F8F6')
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  camera.fov = 40
  camera.updateProjectionMatrix()

  hitSound = new Audio('/sounds/hit.mp3')

  /**
   * Physics world
   */
  world = new CANNON.World()
  world.gravity.set(0, -parameters.gravity, 0)
  // Sweep-and-prune beats the naive O(n²) broadphase once bodies are spread
  // out, and a settled pile is exactly that.
  world.broadphase = new CANNON.SAPBroadphase(world)
  // Letters that have come to rest stop being simulated until something hits
  // them — the physics equivalent of the `isFlying` flag in lesson 50.
  world.allowSleep = true

  const physicsMaterial = new CANNON.Material('letter')
  world.defaultContactMaterial = new CANNON.ContactMaterial(
    physicsMaterial,
    physicsMaterial,
    { friction: parameters.friction, restitution: parameters.restitution },
  )

  const playHitSound = (event: { contact: CANNON.ContactEquation }) => {
    if (!parameters.sound || !hitSound) {
      return
    }

    const impact = event.contact.getImpactVelocityAlongNormal()
    if (impact < HIT_SOUND_THRESHOLD) {
      return
    }

    // Volume tracks the impact so a hard landing reads louder than a nudge.
    hitSound.volume = Math.min(impact / 8, 1)
    hitSound.currentTime = 0
    void hitSound.play()
  }

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let isPointerOverCanvas = false
  // Knocks follow pointer *movement*, never the clock: the ray is cast every
  // frame, so a parked cursor would keep shoving whatever sits under it.
  let hasPointerMoved = false
  let hoveredLetters = new Set<number>()
  let nextHoveredLetters = new Set<number>()

  hitboxGeometry = new THREE.BoxGeometry(1, 1, 1)
  const letterGroup = new THREE.Group()
  scene.add(letterGroup)

  /**
   * Ground
   */
  const floorBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
    material: physicsMaterial,
  })
  // A cannon Plane faces +Z and is infinite; rotate it to lie flat.
  floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5)
  world.addBody(floorBody)

  const floorGeometry = new THREE.PlaneGeometry(24, 24)
  const floorMaterial = new THREE.MeshStandardMaterial({ color: '#e8e6e1', roughness: 0.9 })
  floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
  floorMesh.rotation.x = -Math.PI * 0.5
  floorMesh.receiveShadow = true
  scene.add(floorMesh)

  /**
   * Lights
   */
  const ambientLight = new THREE.AmbientLight('#ffffff', 1.6)
  const directionalLight = new THREE.DirectionalLight('#ffffff', 2.2)
  directionalLight.position.set(4, 8, 6)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.set(2048, 2048)
  directionalLight.shadow.camera.far = 25
  // Tight frustum: the shadow map only has to cover the headline and the patch
  // of floor it lands on, and a wider box spends its texels on empty ground.
  directionalLight.shadow.camera.left = -6
  directionalLight.shadow.camera.right = 6
  directionalLight.shadow.camera.top = 6
  directionalLight.shadow.camera.bottom = -6
  // Extruded glyphs are thin in places and self-shadow into stripes without a
  // bias; normalBias handles the faces that are nearly edge-on to the light.
  directionalLight.shadow.bias = -0.0004
  // Small: glyph strokes are only a few texels wide in the shadow map, and a
  // large normalBias eats them from the edges until the shadow looks torn.
  directionalLight.shadow.normalBias = 0.004
  scene.add(ambientLight, directionalLight)

  letterMaterial = new THREE.MeshStandardMaterial({
    color: '#12b488',
    roughness: 0.45,
    metalness: 0.1,
  })

  const clearLetters = () => {
    for (const letter of letters) {
      letter.body.removeEventListener('collide', playHitSound)
      world?.removeBody(letter.body)
    }
    for (const glyph of glyphs) {
      glyph.geometry.dispose()
    }
    letterGroup.clear()
    letters = []
    glyphs = []
  }

  const buildText = () => {
    const font = fonts[parameters.font]
    if (!font || !world || !letterMaterial) {
      return
    }

    clearLetters()

    const layout = layoutGlyphs(parameters.text.split('|'), font, {
      size: parameters.size,
      depth: parameters.depth,
      lineHeight: LINE_HEIGHT,
      letterSpacing: parameters.letterSpacing,
      bevel: true,
    })
    glyphs = layout.glyphs

    const floorY = layout.bounds.min.y - parameters.size * FLOOR_DROP

    for (const [index, glyph] of glyphs.entries()) {
      const mesh = new THREE.Mesh(glyph.geometry, letterMaterial)
      mesh.position.copy(glyph.position)
      mesh.castShadow = true

      // A box round the glyph, not the glyph itself. cannon has no concave
      // shape that collides with another concave shape, and every letter with
      // a counter or a crossbar is concave — so this is the honest ceiling on
      // contact accuracy here, not a shortcut.
      const half = new CANNON.Vec3(
        glyph.extent.x / 2,
        glyph.extent.y / 2,
        glyph.extent.z / 2,
      )
      const restPosition = new CANNON.Vec3(glyph.position.x, glyph.position.y, glyph.position.z)
      const body = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Box(half),
        material: physicsMaterial,
        position: restPosition.clone(),
        // Static until knocked: a static body ignores gravity, which is how the
        // headline hangs in mid-air without any code holding it up.
        type: CANNON.Body.STATIC,
      })
      body.addEventListener('collide', playHitSound)
      world.addBody(body)

      const hitbox = new THREE.Mesh(hitboxGeometry, letterMaterial)
      hitbox.visible = false
      hitbox.position.copy(glyph.position)
      hitbox.scale.set(glyph.extent.x * 1.08, glyph.extent.y * 1.08, Math.max(glyph.extent.z, parameters.size))
      hitbox.userData.letterIndex = index

      letterGroup.add(mesh, hitbox)
      letters.push({ mesh, body, hitbox, restPosition })
    }

    if (floorMesh) {
      floorMesh.position.y = floorY
    }
    floorBody.position.y = floorY

    // Frame the headline and the ground it lands on, from slightly above so the
    // pile reads as a pile rather than a row.
    const height = layout.bounds.max.y - floorY
    const halfFov = THREE.MathUtils.degToRad(camera.fov) / 2
    const width = layout.bounds.max.x - layout.bounds.min.x
    const distance = Math.max(
      height / 2 / Math.tan(halfFov),
      width / 2 / (Math.tan(halfFov) * camera.aspect),
    ) * 1.45
    // Biased towards the floor: that is where the letters end up, and framing
    // on the midpoint leaves the pile hanging off the bottom edge.
    const focusY = layout.bounds.max.y * 0.35 + floorY * 0.65
    camera.near = distance * 0.05
    camera.far = distance * 6
    camera.updateProjectionMatrix()
    camera.position.set(0, focusY + height * 0.06, distance)
    camera.lookAt(0, focusY, 0)
    controls?.target.set(0, focusY, 0)
    controls?.update()

    isLoading.value = false
  }

  /**
   * Interaction
   */
  const knockLetter = (letter: FallingLetter, contactPoint: THREE.Vector3) => {
    // Waking the body *is* the effect: a static body has no mass and ignores
    // gravity, so flipping the type is what drops the letter out of the line.
    if (letter.body.type === CANNON.Body.STATIC) {
      letter.body.type = CANNON.Body.DYNAMIC
      // invMass is derived from the type, so it has to be recomputed — skip
      // this and the body stays infinitely heavy and never moves.
      letter.body.updateMassProperties()
    }
    letter.body.wakeUp()

    const push = new CANNON.Vec3(
      letter.body.position.x - contactPoint.x,
      0,
      // Always towards the viewer, so the pile falls forward into shot.
      0.6,
    )
    push.normalize()
    push.scale(parameters.impulse, push)

    // Applied at the point the ray actually hit, offset from the centre of
    // mass — so the spin is a consequence of where you touched the letter
    // rather than a random number. This is the thing the spring version fakes.
    const lever = new CANNON.Vec3(
      contactPoint.x - letter.body.position.x,
      contactPoint.y - letter.body.position.y,
      contactPoint.z - letter.body.position.z,
    )
    letter.body.applyImpulse(push, lever)
  }

  const resetLetters = () => {
    for (const letter of letters) {
      letter.body.type = CANNON.Body.STATIC
      letter.body.updateMassProperties()
      letter.body.position.copy(letter.restPosition)
      letter.body.quaternion.set(0, 0, 0, 1)
      letter.body.velocity.setZero()
      letter.body.angularVelocity.setZero()
      // A static body is not stepped, so push the new transform out by hand.
      letter.body.initPosition.copy(letter.restPosition)
      letter.mesh.position.set(letter.restPosition.x, letter.restPosition.y, letter.restPosition.z)
      letter.mesh.quaternion.set(0, 0, 0, 1)
      letter.hitbox.position.copy(letter.mesh.position)
    }
    hoveredLetters.clear()
  }

  parameters.reset = resetLetters

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

  canvas.addEventListener('pointermove', handlePointerMove)
  canvas.addEventListener('pointerdown', handlePointerMove)
  canvas.addEventListener('pointerleave', handlePointerLeave)

  detachListeners = () => {
    canvas.removeEventListener('pointermove', handlePointerMove)
    canvas.removeEventListener('pointerdown', handlePointerMove)
    canvas.removeEventListener('pointerleave', handlePointerLeave)
  }

  for (const name of Object.keys(FONT_URLS) as FontName[]) {
    lesson.fontLoader.load(
      FONT_URLS[name],
      (font) => {
        fonts[name] = font
        if (parameters.font === name) {
          buildText()
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
  textFolder.add(parameters, 'text').name('Text ( | = line break)').onFinishChange(buildText)
  textFolder.add(parameters, 'font', Object.keys(FONT_URLS)).name('Font').onChange(buildText)
  textFolder.add(parameters, 'size').min(0.4).max(1.6).step(0.05).name('Size').onFinishChange(buildText)
  textFolder.add(parameters, 'depth').min(0.05).max(0.8).step(0.01).name('Depth').onFinishChange(buildText)
  textFolder.add(parameters, 'letterSpacing').min(-0.1).max(0.4).step(0.01).name('Tracking').onFinishChange(buildText)

  const physicsFolder = gui.addFolder('Physics')
  physicsFolder.add(parameters, 'gravity').min(0).max(30).step(0.1).name('Gravity').onChange((value: number) => {
    world?.gravity.set(0, -value, 0)
  })
  physicsFolder.add(parameters, 'restitution').min(0).max(1).step(0.05).name('Bounciness').onChange((value: number) => {
    if (world) {
      world.defaultContactMaterial.restitution = value
    }
  })
  physicsFolder.add(parameters, 'friction').min(0).max(1).step(0.05).name('Friction').onChange((value: number) => {
    if (world) {
      world.defaultContactMaterial.friction = value
    }
  })
  physicsFolder.add(parameters, 'impulse').min(0).max(10).step(0.1).name('Knock strength')
  physicsFolder.add(parameters, 'sound').name('Impact sound')
  physicsFolder.add(parameters, 'reset').name('Reset')

  /**
   * Animate
   */
  const clock = new THREE.Clock()

  const tick = () => {
    // A backgrounded tab hands back a delta of several seconds on return.
    // cannon's fixed step absorbs that, but capping the catch-up keeps it from
    // burning a hundred sub-steps in one frame.
    const delta = Math.min(clock.getDelta(), 1 / 30)

    if (isPointerOverCanvas && hasPointerMoved) {
      hasPointerMoved = false
      raycaster.setFromCamera(pointer, camera)

      // Invisible boxes, not the glyphs: raycasting the real geometry would
      // miss the counters of O and the gaps in E.
      nextHoveredLetters.clear()
      for (const intersection of raycaster.intersectObjects(letters.map(letter => letter.hitbox), false)) {
        const index = intersection.object.userData.letterIndex as number
        nextHoveredLetters.add(index)

        const letter = letters[index]
        if (letter && !hoveredLetters.has(index)) {
          knockLetter(letter, intersection.point)
        }
      }

      const previousHovered = hoveredLetters
      hoveredLetters = nextHoveredLetters
      nextHoveredLetters = previousHovered
    }
    else if (!isPointerOverCanvas && hoveredLetters.size > 0) {
      hoveredLetters.clear()
    }

    // Fixed 60 Hz internally, with up to 3 catch-up sub-steps. Feeding the raw
    // frame delta straight in would make the simulation frame-rate dependent.
    world?.step(1 / 60, delta, 3)

    // The whole of the animation code: cannon owns the transform, three mirrors
    // it. Compare with the hand-rolled integrator in lesson 50.
    for (const letter of letters) {
      const { position, quaternion } = letter.body
      letter.mesh.position.set(position.x, position.y, position.z)
      letter.mesh.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w)
      letter.hitbox.position.copy(letter.mesh.position)
    }

    controls?.update()
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

  for (const glyph of glyphs) {
    glyph.geometry.dispose()
  }
  letterMaterial?.dispose()
  hitboxGeometry?.dispose()
  floorMesh?.geometry.dispose()
  ;(floorMesh?.material as THREE.Material | undefined)?.dispose()

  if (hitSound) {
    hitSound.pause()
    hitSound.src = ''
  }

  // cannon has no dispose; dropping the references is the teardown.
  letters = []
  glyphs = []
  world = null

  disposeLesson?.()
  renderer?.dispose()
})
</script>
