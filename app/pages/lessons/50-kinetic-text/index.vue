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

const seoTitle = 'Kinetic Text — Three.js Lesson | Alex Buki Developer'
const seoDescription
  = 'Interactive kinetic typography with Three.js: extruded per-letter geometry, pointer raycasting and spring physics that knock letters out of the headline and settle them back.'

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

const parameters = {
  // lil-gui has no multiline input, so `|` stands in for a line break.
  text: 'MADE TO|MOVE',
  // Resting letters are flat because their sides are black, not because of the
  // camera, so this can stay wide enough to give flying letters real depth.
  fov: 14,
  // Helvetiker, not the site's Sora: Sora's JSON carries near-duplicate points
  // in a few glyphs (M is the obvious one) and TextGeometry's triangulation
  // fills a wedge that isn't in the outline. Sora stays selectable in the GUI.
  font: 'Helvetiker' as FontName,
  size: 1,
  depth: 0.22,
  letterSpacing: 0.02,
  // Tuned against the reference clip: a letter travels roughly 1.5x its own
  // height, turns a bit over one full revolution, and is home inside ~1.2s.
  // Amplitude is impulse / sqrt(stiffness), so those two move together.
  impulse: 4.5,
  lift: 2.2,
  spin: 6,
  stiffness: 8,
  damping: 1.6,
  flatten: 4,
  // Letter-on-letter restitution. Low: glyphs shove each other aside and let
  // the springs take over, rather than clacking around like billiard balls.
  bounce: 0.35,
  // Peak shadow opacity, at full travel. Resting letters cast none at all.
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

  // Hard vector edges against a flat background — this is the one scene here
  // where MSAA is the difference between crisp and cheap-looking.
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

  // Well under the shared 75° default: a long lens keeps the headline's own
  // proportions honest and stops outer letters from splaying toward the edges.
  camera.fov = parameters.fov
  camera.updateProjectionMatrix()

  controls.enabled = parameters.orbit

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let isPointerOverCanvas = false
  // Knocks are driven by pointer *movement*, never by the clock. Standing still
  // must leave the scene alone: the ray is cast every frame, so without this a
  // parked cursor would keep re-hitting whatever drifted back underneath it.
  let hasPointerMoved = false

  // Letters the ray was inside on the previous frame. Knocking on *entry* only
  // is what makes a parked cursor behave: the ray tests every frame, so hitting
  // on every hit would re-kick the same letter 60 times a second.
  let hoveredLetters = new Set<number>()
  let nextHoveredLetters = new Set<number>()

  const fitCameraToText = () => {
    if (kineticText) {
      // Generous margin: knocked letters travel well past the headline's own
      // box, and clipping them at the frame edge looks like a bug, not a limit.
      fitCameraToBounds(camera, kineticText.bounds, 1.28)
      controls?.target.set(0, 0, 0)
      controls?.update()
    }
  }

  const rebuildText = () => {
    const font = fonts[parameters.font]
    if (!font) {
      return
    }

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
  // Runs after useLesson's own resize listener, so camera.aspect is already current.
  window.addEventListener('resize', handleResize)

  detachListeners = () => {
    canvas.removeEventListener('pointermove', handlePointerMove)
    canvas.removeEventListener('pointerdown', handlePointerMove)
    canvas.removeEventListener('pointerleave', handlePointerLeave)
    window.removeEventListener('resize', handleResize)
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

  const motionFolder = gui.addFolder('Motion')
  motionFolder.add(parameters, 'impulse').min(0).max(10).step(0.1).name('Impulse')
  motionFolder.add(parameters, 'lift').min(0).max(6).step(0.1).name('Lift')
  motionFolder.add(parameters, 'spin').min(0).max(20).step(0.25).name('Spin from lever')
  motionFolder.add(parameters, 'stiffness').min(2).max(60).step(0.5).name('Stiffness')
  motionFolder.add(parameters, 'damping').min(0.2).max(12).step(0.1).name('Damping')
  motionFolder.add(parameters, 'flatten').min(0.5).max(20).step(0.5).name('Flatten')
  motionFolder.add(parameters, 'bounce').min(0).max(1).step(0.05).name('Bounce')

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
   * Animate
   */
  const clock = new THREE.Clock()

  const tick = () => {
    // A backgrounded tab hands back a delta of several seconds on return; the
    // spring integrator would fling every letter off screen.
    const delta = Math.min(clock.getDelta(), 1 / 30)

    if (kineticText && isPointerOverCanvas && hasPointerMoved) {
      hasPointerMoved = false
      raycaster.setFromCamera(pointer, camera)

      // The hitboxes are invisible proxies riding along with each glyph —
      // raycasting the real geometry would miss the counters of O and E.
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
  kineticText?.dispose()
  disposeLesson?.()
  renderer?.dispose()
})
</script>
