<template>
  <div ref="containerRef" class="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-xl">
    <canvas
      ref="canvasRef"
      class="h-full w-full outline-none transition-opacity duration-700"
      :class="isLoading ? 'opacity-0' : 'opacity-100'"
      role="img"
      :aria-label="$t('hero.avatar_alt')"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, type Ref } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useLesson } from '@/composables/three-js-lessons/useLesson'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
// The canvas stays transparent over the page background while the model streams in,
// then fades in already posed and animating: no placeholder colour, no pop.
const isLoading = ref(true)

let animationId = 0
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let disposeLesson: (() => void) | null = null
let mixer: THREE.AnimationMixer | null = null
let model: THREE.Group | null = null
const CROSSFADE_S = 0.4

onMounted(() => {
  if (!canvasRef.value || !containerRef.value) {
    return
  }

  const lesson = useLesson(
    canvasRef as Ref<HTMLCanvasElement>,
    containerRef as Ref<HTMLDivElement>,
    { antialias: true, alpha: true },
  )
  const { camera, scene, gui } = lesson
  renderer = lesson.renderer
  controls = lesson.controls
  disposeLesson = lesson.disposeLesson

  // The lesson GUI has no place on the home page.
  gui.destroy()

  renderer.outputColorSpace = THREE.SRGBColorSpace
  // Filmic tone mapping keeps the flat palette colours from clipping into orange under the lights.
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearAlpha(0)

  // Wheel over the avatar must scroll the page, not zoom the model; dragging to look around stays.
  controls.enableZoom = false
  controls.enablePan = false
  // Keep the character upright: no looking at it from below or from the top.
  controls.minPolarAngle = Math.PI * 0.35
  controls.maxPolarAngle = Math.PI * 0.6

  // Soft sky/ground fill plus one key light from the front-left, so the flat
  // chibi materials still read as volumes.
  // Neutral fill so the skin and shirt keep their own hue; one soft key from the front-left.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d5cd, 1.8))
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8)
  keyLight.position.set(-2, 4, 3)
  scene.add(keyLight)

  // A narrower lens than the lesson default keeps the head from bulging.
  camera.fov = 32
  camera.updateProjectionMatrix()

  const clock = new THREE.Clock()

  // The model is meshopt-compressed (gltf-transform); the decoder ships with three.
  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  loader.load(
    '/models/alex.glb',
    async (gltf) => {
      model = gltf.scene
      // Anisotropic filtering keeps the face and cloth crisp on surfaces seen at an angle.
      const maxAnisotropy = renderer!.capabilities.getMaxAnisotropy()
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial && child.material.map) {
          child.material.map.anisotropy = maxAnisotropy
          child.material.map.needsUpdate = true
        }
      })
      scene.add(model)

      // Frame the whole character: distance from its height and the lens.
      const bounds = new THREE.Box3().setFromObject(model)
      const size = bounds.getSize(new THREE.Vector3())
      const center = bounds.getCenter(new THREE.Vector3())
      const distance = (size.y / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.15
      camera.position.set(center.x + size.x * 0.15, center.y + size.y * 0.05, center.z + distance)
      controls.target.copy(center)

      // Shaders compile while the canvas is still invisible.
      await renderer!.compileAsync(scene, camera)

      // Start the clips only now, from a fresh clock: otherwise the first update gets
      // the whole load time as one delta and the wave jumps straight to mid-swing.
      clock.getDelta()
      // Clips come from Mixamo (tools/avatar/import_mixamo_pbr.py): one wave on
      // arrival, then the breathing idle loops for good.
      const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'Idle')
      const waveClip = THREE.AnimationClip.findByName(gltf.animations, 'Wave')
      if (idleClip) {
        mixer = new THREE.AnimationMixer(model)
        const idle = mixer.clipAction(idleClip).play()

        if (waveClip) {
          const wave = mixer.clipAction(waveClip)
          wave.setLoop(THREE.LoopOnce, 1)
          // Hold the last frame so the fade to idle starts from where the hand ended.
          wave.clampWhenFinished = true
          // Idle already runs underneath at zero weight, so the fade lands mid-breath.
          idle.setEffectiveWeight(0)
          wave.play()
          mixer.addEventListener('finished', (event) => {
            if (event.action === wave) {
              // The fade scales the action's own weight, so give idle its full weight back first.
              idle.setEffectiveWeight(1)
              wave.crossFadeTo(idle, CROSSFADE_S, false)
            }
          })
        }
        // Pose the skeleton before the first visible frame, so the bind A-pose never shows.
        mixer.update(0)
      }

      isLoading.value = false
    },
    undefined,
    (error) => {
      console.error('Avatar model failed to load:', error)
      isLoading.value = false
    },
  )

  const tick = () => {
    mixer?.update(clock.getDelta())
    controls!.update()
    renderer!.render(scene, camera)
    animationId = requestAnimationFrame(tick)
  }
  tick()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  disposeLesson?.()
  controls?.dispose()
  mixer?.stopAllAction()
  model?.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return
    }
    child.geometry.dispose()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    for (const material of materials) {
      // The PBR model carries colour, normal and ORM maps; free every one of them.
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) {
          value.dispose()
        }
      }
      material.dispose()
    }
  })
  renderer?.dispose()
})
</script>
