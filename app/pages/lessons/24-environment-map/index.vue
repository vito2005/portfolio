<template>
  <div ref="containerRef" class="flex-1 min-h-0 relative w-full overflow-hidden rounded-xl">
    <canvas ref="canvasRef" class="w-full h-full outline-none" />
    <div
      v-show="isLoading"
      class="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm transition-opacity duration-200"
    >
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-700" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useLesson } from '@/composables/three-js-lessons/useLesson'

definePageMeta({
  layout: "lessons",
});

const route = useRoute()
const url = useRequestURL()
const canonicalUrl = url.origin + route.path

const seoTitle = 'Environment Map — Three.js Lesson | Alex Buki Developer'
const seoDescription =
  'Learn environment maps in Three.js: HDRI reflections, grounded skybox, model lighting, and interactive controls.'

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

const canvasRef = ref(null)
const containerRef = ref(null)
const isLoading = ref(true)

let animationId
let controls
let renderer
let gui

onMounted(() => {
  if (!canvasRef.value || !containerRef.value) return

  const lessonData = useLesson(canvasRef, containerRef)
  const { camera, scene, renderer: lessonRenderer, controls: lessonControls, gui: lessonGui, textureLoader } = lessonData
  renderer = lessonRenderer
  controls = lessonControls
  gui = lessonGui

  const gltfLoader = new GLTFLoader()
  let pendingAssets = 2

  const markAssetProcessed = () => {
    pendingAssets -= 1
    if (pendingAssets <= 0) {
      isLoading.value = false
    }
  }

  gui.domElement.style.position = 'absolute'
  gui.domElement.style.top = '0'
  gui.domElement.style.right = '0'

  scene.environmentIntensity = 1
  scene.backgroundBlurriness = 0
  scene.backgroundIntensity = 1

  gui.add(scene, 'environmentIntensity').min(0).max(10).step(0.001)
  gui.add(scene, 'backgroundBlurriness').min(0).max(1).step(0.001)
  gui.add(scene, 'backgroundIntensity').min(0).max(10).step(0.001)
  gui.add(scene.backgroundRotation, 'y').min(0).max(Math.PI * 2).step(0.001).name('backgroundRotationY')
  gui.add(scene.environmentRotation, 'y').min(0).max(Math.PI * 2).step(0.001).name('environmentRotationY')

  // rgbeLoader.load('/environmentMaps/2/2k.hdr', (environmentMap) => {
  //   environmentMap.mapping = THREE.EquirectangularReflectionMapping
  //   scene.environment = environmentMap

  //   const skybox = new GroundedSkybox(environmentMap, 15, 70)
  //   skybox.position.y = 15
  //   scene.add(skybox)
  // })

  // /**
//  * Real time environment map
//  */
// // Base environment map
  textureLoader.load(
    '/environmentMaps/blockadesLabsSkybox/interior_views_cozy_wood_cabin_with_cauldron_and_p.jpg',
    (environmentMap) => {
      environmentMap.mapping = THREE.EquirectangularReflectionMapping
      environmentMap.colorSpace = THREE.SRGBColorSpace
      scene.background = environmentMap
      markAssetProcessed()
    },
    undefined,
    () => {
      markAssetProcessed()
    }
  )

  // // Holy donut
  const holyDonut = new THREE.Mesh(
      new THREE.TorusGeometry(8, 0.5),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(10, 4, 2) })
  )
  holyDonut.layers.enable(1)
  holyDonut.position.y = 3.5
  scene.add(holyDonut)

  // // Cube render target
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(
      256,
      {
          type: THREE.FloatType
      }
  )

  scene.environment = cubeRenderTarget.texture

// // Cube camera
  const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget)
  cubeCamera.layers.set(1)

  const torusKnot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1, 0.4, 100, 16),
    new THREE.MeshStandardMaterial({ roughness: 0, metalness: 1, color: 0xaaaaaa })
  )
  torusKnot.position.x = -4
  torusKnot.position.y = 4
  scene.add(torusKnot)

  gltfLoader.load(
    '/models/FlightHelmet/glTF/FlightHelmet.gltf',
    (gltf) => {
      gltf.scene.scale.set(10, 10, 10)
      scene.add(gltf.scene)
      markAssetProcessed()
    },
    undefined,
    () => {
      markAssetProcessed()
    }
  )

  camera.position.set(8, 5, 10)
  controls.target.y = 3.5
  controls.enableDamping = true

  const clock = new THREE.Clock()

  const tick = () => {
    const elapsedTime = clock.getElapsedTime()

        // // Real time environment map
    if(holyDonut) {
        holyDonut.rotation.x = Math.sin(elapsedTime) * 2

        cubeCamera.update(renderer, scene)
    }
    controls.update()
    renderer.render(scene, camera)
    animationId = window.requestAnimationFrame(tick)
  }

  tick()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (gui) {
    gui.destroy()
  }
  if (controls) {
    controls.dispose()
  }
  if (renderer) {
    renderer.dispose()
  }
})
</script>
