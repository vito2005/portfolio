<template>
  <div ref="containerRef" class="flex-1 min-h-0 relative w-full overflow-hidden rounded-xl">
    <canvas ref="canvasRef" class="w-full h-full outline-none touch-none" />
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center bg-black text-sm text-gray-400"
    >
      Loading…
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type GUI from 'lil-gui'
import { useLesson } from '@/composables/three-js-lessons/useLesson'
import {
  createKineticText,
  fitCameraToBounds,
  knockLetter,
  updateKineticLetters,
  type KineticText,
} from '@/composables/three-js-lessons/kineticText'

definePageMeta({
  layout: 'lessons',
})

const route = useRoute()
const url = useRequestURL()
const canonicalUrl = url.origin + route.path

const seoTitle = 'Kinetic Matcap Text — Three.js Lesson | Alex Buki Developer'
const seoDescription
  = 'Matcap-shaded 3D text that scatters under the pointer: per-letter TextGeometry, raycasting, spring return and letter-on-letter collisions in Three.js.'

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

// Three.js handles are plain `let` on purpose — wrapping them in `ref()` puts a
// reactive proxy around the object graph, which breaks internal identity checks.
let animationId = 0
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let gui: GUI | null = null
let kineticText: KineticText | null = null
let letterMaterial: THREE.MeshMatcapMaterial | null = null
let donutGeometry: THREE.TorusGeometry | null = null
let disposeLesson: (() => void) | null = null
let detachListeners: (() => void) | null = null
const matcapTextures: (THREE.Texture | null)[] = new Array(8).fill(null)

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

/** Matches lesson 12's field of scattered torus knots. */
const DONUT_COUNT = 100

const parameters = {
  // lil-gui has no multiline input, so `|` stands in for a line break.
  text: 'Alex Buki',
  font: 'Sora' as FontName,
  matcap: 8,
  size: 0.8,
  depth: 0.3,
  letterSpacing: 0.02,
  donuts: true,
  // Softer than lesson 50's: this camera sits only a few units from the text,
  // so the same impulse throws a letter clean out of frame. Amplitude is
  // impulse / sqrt(stiffness) — both ends are tightened here.
  impulse: 3.2,
  lift: 1.4,
  spin: 8,
  stiffness: 11,
  damping: 1.6,
  flatten: 4,
  bounce: 0.35,
  orbit: true,
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

  // Matcaps carry their own lighting, so the scene needs none — and a dark
  // ground is what makes the baked highlights read.
  scene.background = new THREE.Color('#111111')

  // Wider than lesson 50's near-orthographic framing on purpose: here the
  // solid is meant to look solid at all times, and perspective is what sells
  // the depth of a letter that is simply sitting still.
  camera.fov = 45
  camera.updateProjectionMatrix()

  controls.enabled = parameters.orbit

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let isPointerOverCanvas = false
  // Knocks are driven by pointer *movement*, never by the clock: the ray is
  // cast every frame, so a parked cursor would otherwise keep re-hitting
  // whatever drifted back underneath it.
  let hasPointerMoved = false

  // Letters the ray was inside on the previous frame — knocking on entry only.
  let hoveredLetters = new Set<number>()
  let nextHoveredLetters = new Set<number>()

  const donuts = new THREE.Group()
  scene.add(donuts)

  const fitCameraToText = () => {
    if (kineticText) {
      fitCameraToBounds(camera, kineticText.bounds, 1.5)
      controls?.target.set(0, 0, 0)
      controls?.update()
    }
  }

  const rebuildText = () => {
    const font = fonts[parameters.font]
    if (!font || !letterMaterial) {
      return
    }

    kineticText?.dispose()
    kineticText = createKineticText(parameters.text.split('|'), font, {
      size: parameters.size,
      depth: parameters.depth,
      lineHeight: LINE_HEIGHT,
      letterSpacing: parameters.letterSpacing,
      // Rounded edges give the matcap a highlight to run along; without them
      // the glyphs read as flat cut-outs even while tumbling.
      bevel: true,
      // One material on every face, never recoloured — the whole point here is
      // that the solid stays a solid whether it is moving or not.
      appearance: { kind: 'uniform', material: letterMaterial },
      shadow: false,
    })
    scene.add(kineticText.group)

    fitCameraToText()
    isLoading.value = false
  }

  const buildDonuts = () => {
    if (!letterMaterial) {
      return
    }

    donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 24, 48)

    for (let index = 0; index < DONUT_COUNT; index += 1) {
      const donut = new THREE.Mesh(donutGeometry, letterMaterial)
      // A hollow shell, not a filled cube: the middle is where the text lives,
      // and donuts spawned there would sit on top of the headline.
      const radius = 5 + Math.random() * 5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const z = radius * Math.cos(phi)
      donut.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        // Folded behind the text plane. The camera frames the headline from
        // only a few units away, so anything spawned in front of it lands
        // between lens and subject and fills the screen with one blurry torus.
        z > 1 ? -z : z,
      )
      donut.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      const scale = 0.4 + Math.random() * 0.8
      donut.scale.setScalar(scale)

      donuts.add(donut)
    }
  }

  /**
   * Pointer position is normalised against the canvas rect, not the window —
   * the canvas is an inset box inside the lessons layout.
   */
  const handlePointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Repeated events at the same coordinates are not movement.
    if (x !== pointer.x || y !== pointer.y) {
      hasPointerMoved = true
    }

    pointer.set(x, y)
    isPointerOverCanvas = true
  }

  const handlePointerLeave = () => {
    isPointerOverCanvas = false
    // Forget what was under the cursor, so coming back in counts as a fresh
    // entry rather than a letter that was "already hovered".
    hoveredLetters.clear()
  }

  const handleResize = () => {
    fitCameraToText()
  }

  canvas.addEventListener('pointermove', handlePointerMove)
  canvas.addEventListener('pointerdown', handlePointerMove)
  canvas.addEventListener('pointerleave', handlePointerLeave)
  // Runs after useLesson's own resize listener, so camera.aspect is current.
  window.addEventListener('resize', handleResize)

  detachListeners = () => {
    canvas.removeEventListener('pointermove', handlePointerMove)
    canvas.removeEventListener('pointerdown', handlePointerMove)
    canvas.removeEventListener('pointerleave', handlePointerLeave)
    window.removeEventListener('resize', handleResize)
  }

  /**
   * Textures
   */
  const loadMatcap = (index: number) => {
    lesson.textureLoader.load(`/textures/matcaps/${index + 1}.png`, (texture) => {
      // A matcap is a colour map — leaving it linear washes the shading out.
      texture.colorSpace = THREE.SRGBColorSpace
      matcapTextures[index] = texture

      if (parameters.matcap === index + 1 && letterMaterial) {
        letterMaterial.matcap = texture
        letterMaterial.needsUpdate = true
      }
    })
  }

  // The chosen matcap first: the scene cannot draw anything without it. The
  // rest are only needed if the GUI asks for them, so they wait for the tick.
  lesson.textureLoader.load(
    `/textures/matcaps/${parameters.matcap}.png`,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      matcapTextures[parameters.matcap - 1] = texture
      letterMaterial = new THREE.MeshMatcapMaterial({ matcap: texture })
      buildDonuts()
      rebuildText()
    },
    undefined,
    () => {
      // A failed matcap must still clear the overlay, or it hangs forever.
      isLoading.value = false
    },
  )

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
  textFolder.add(parameters, 'size').min(0.3).max(1.6).step(0.05).name('Size').onFinishChange(rebuildText)
  textFolder.add(parameters, 'depth').min(0.05).max(0.8).step(0.01).name('Depth').onFinishChange(rebuildText)
  textFolder.add(parameters, 'letterSpacing').min(-0.1).max(0.4).step(0.01).name('Tracking').onFinishChange(rebuildText)

  const motionFolder = gui.addFolder('Motion')
  motionFolder.add(parameters, 'impulse').min(0).max(10).step(0.1).name('Impulse')
  motionFolder.add(parameters, 'lift').min(0).max(6).step(0.1).name('Lift')
  motionFolder.add(parameters, 'spin').min(0).max(20).step(0.25).name('Spin from lever')
  motionFolder.add(parameters, 'stiffness').min(2).max(60).step(0.5).name('Stiffness')
  motionFolder.add(parameters, 'damping').min(0.2).max(12).step(0.1).name('Damping')
  motionFolder.add(parameters, 'flatten').min(0.5).max(20).step(0.5).name('Flatten')
  motionFolder.add(parameters, 'bounce').min(0).max(1).step(0.05).name('Bounce')

  const lookFolder = gui.addFolder('Look')
  lookFolder.add(parameters, 'matcap', matcapTextures.map((_, index) => index + 1))
    .name('Matcap')
    .onChange((value: number) => {
      const texture = matcapTextures[value - 1]
      if (texture && letterMaterial) {
        letterMaterial.matcap = texture
        letterMaterial.needsUpdate = true
      }
    })
  lookFolder.add(parameters, 'donuts').name('Donuts').onChange((value: boolean) => {
    donuts.visible = value
  })
  lookFolder.add(parameters, 'orbit').name('Orbit camera').onChange((value: boolean) => {
    if (controls) {
      controls.enabled = value
    }
  })

  /**
   * Animate
   */
  const clock = new THREE.Clock()
  let hasQueuedMatcaps = false

  const tick = () => {
    // A backgrounded tab hands back a delta of several seconds on return; the
    // spring integrator would fling every letter off screen.
    const delta = Math.min(clock.getDelta(), 1 / 30)

    // Deferred to after the first frame so the scene appears immediately
    // instead of waiting on eight textures it may never need.
    if (!hasQueuedMatcaps && letterMaterial) {
      hasQueuedMatcaps = true
      for (let index = 0; index < matcapTextures.length; index += 1) {
        if (!matcapTextures[index]) {
          loadMatcap(index)
        }
      }
    }

    if (kineticText && isPointerOverCanvas && hasPointerMoved) {
      hasPointerMoved = false
      raycaster.setFromCamera(pointer, camera)

      // The hitboxes are invisible proxies riding along with each glyph —
      // raycasting the real geometry would miss the counters of O and e.
      nextHoveredLetters.clear()
      for (const intersection of raycaster.intersectObjects(kineticText.hitboxes, false)) {
        const index = intersection.object.userData.letterIndex as number
        nextHoveredLetters.add(index)

        // A letter already in flight is fair game; only re-entry gates the hit.
        const letter = kineticText.letters[index]
        if (letter && !hoveredLetters.has(index)) {
          knockLetter(letter, intersection.point, parameters)
        }
      }

      const previousHovered = hoveredLetters
      hoveredLetters = nextHoveredLetters
      nextHoveredLetters = previousHovered
    }
    else if (!isPointerOverCanvas && hoveredLetters.size > 0) {
      hoveredLetters.clear()
    }

    if (kineticText) {
      // Settle radius sits just above the flight amplitude, so `flatten` only
      // bites on the way home — set it wider and letters snap flat mid-air.
      updateKineticLetters(kineticText.letters, delta, parameters, parameters.size * 1.6)
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
  // The text borrows `letterMaterial`, so it disposes geometry only — the
  // material and its textures are this page's to clean up.
  kineticText?.dispose()
  donutGeometry?.dispose()
  letterMaterial?.dispose()
  for (const texture of matcapTextures) {
    texture?.dispose()
  }
  disposeLesson?.()
  renderer?.dispose()
})
</script>
