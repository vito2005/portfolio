<template>
  <div class="flex flex-col sm:flex-row items-center">
    <div ref="canvasContainerRef" class="relative w-80 h-80 overflow-hidden rounded-xl">
      <canvas ref="canvasRef" class="w-full h-full outline-none" />
      <div v-show="modelLoading"
        class="absolute inset-0 flex items-center justify-center transition-opacity duration-200">
        <div class="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    </div>
    <div>
      <h2 class="text-2xl font-semibold">{{ headerText }}</h2>
      <p class="text-gray-600 mt-2">{{ descriptionText }}</p>
      <p class="text-gray-600 mt-2">
        {{ lessonsTextBefore }}
        <NuxtLink to="/lessons" class="text-blue-500 hover:underline">{{ lessonsLinkText }}</NuxtLink>
        {{ lessonsTextAfter }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const route = useRoute()
const url = useRequestURL()
const canonicalUrl = url.origin + route.path

const seoTitle = 'Alex Buki — Software Engineer'
const seoDescription =
  "I'm learning WebGL and 3D graphics with Three.js. Here are the lessons I've completed along the way."

useHead({
  title: seoTitle,
  meta: [
    { name: 'description', content: seoDescription },
    { property: 'og:type', content: 'website' },
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

const { typeText } = useTypewriter()

const headerText = ref('')
const descriptionText = ref('')
const lessonsTextBefore = ref('')
const lessonsLinkText = ref('')
const lessonsTextAfter = ref('')

const texts = [
  { text: "Hello, I'm Alex Buki - a software engineer.", ref: headerText },
  { text: "I'm currently learning WebGL technology and some 3D graphics libraries like Three.js.", ref: descriptionText },
  { text: "There are some ", ref: lessonsTextBefore },
  { text: "lessons", ref: lessonsLinkText },
  { text: " I've passed while learning these technologies.", ref: lessonsTextAfter },
]

const canvasRef = ref(null)
const canvasContainerRef = ref(null)
const modelLoading = ref(true)

let animationId
let renderer
let scene
let camera
let controls
let resizeHandler
let mixer
let clock

onMounted(async () => {


  if (!canvasRef.value || !canvasContainerRef.value) return

  const { width, height } = canvasContainerRef.value.getBoundingClientRect()
  scene = new THREE.Scene()

  const ambientLight = new THREE.AmbientLight(0xffffff, 3)
  scene.add(ambientLight)

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10)

  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  clock = new THREE.Clock()

  const gltfLoader = new GLTFLoader()
  gltfLoader.load(
    '/models/greetings.glb',
    async (gltf) => {
      const model = gltf.scene
      model.position.y = -0.7

      scene.add(model)

      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      camera.position.set(center.x, center.y, center.z + 1.3)

      if (gltf.animations?.length) {
        mixer = new THREE.AnimationMixer(model)
        const action = mixer.clipAction(gltf.animations[0])
        action.play()
      }

      await renderer.compileAsync(scene, camera)
      await new Promise((r) => requestAnimationFrame(r))
      modelLoading.value = false

      for (const { text, ref } of texts) {
        await nextTick()
        await typeText(text, ref)
      }
    },
    (xhr) => { },
    (error) => {
      console.error('GLB load error:', error)
      modelLoading.value = false
    }
  )

  resizeHandler = () => {
    if (!canvasContainerRef.value) return
    const { width, height } = canvasContainerRef.value.getBoundingClientRect()
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    renderer.render(scene, camera)
  }
  window.addEventListener('resize', resizeHandler)

  const tick = () => {
    const delta = clock.getDelta()
    if (mixer) mixer.update(delta)
    controls.update()
    renderer.render(scene, camera)
    animationId = requestAnimationFrame(tick)
  }
  tick()

  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
    }
    if (controls) {
      controls.dispose()
    }
    if (renderer) {
      renderer.dispose()
    }
  }
})
</script>
