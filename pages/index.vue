<template>
  <div class="flex flex-col sm:flex-row items-center">

    <div ref="canvasContainerRef" class="relative w-80 h-80 overflow-hidden rounded-xl">
      <canvas ref="canvasRef" class="w-full h-full outline-none" />
      <div
        v-show="modelLoading"
        class="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
      >
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

useHead({
  title: "Alex Buki - Software Engineer",
  meta: [{ name: "description", content: "Alex Buki Software Engineer" }],
});

const { typeText } = useTypewriter()

const headerText = ref('')
const descriptionText = ref('')
const lessonsTextBefore = ref('')
const lessonsLinkText = ref('')
const lessonsTextAfter = ref('')

const texts = [
  { text: "Hello, I'm Alex Buki", ref: headerText },
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

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(-10.23, 150.72, 150.50)

  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(9.43, 73.88, -61.32)

  controls.addEventListener('end', () => {
    const { x, y, z } = camera.position
    const { x: tx, y: ty, z: tz } = controls.target
    console.log(
      'Camera position:\n  camera.position.set(' +
        x.toFixed(2) +
        ', ' +
        y.toFixed(2) +
        ', ' +
        z.toFixed(2) +
        ')\nTarget:\n  controls.target.set(' +
        tx.toFixed(2) +
        ', ' +
        ty.toFixed(2) +
        ', ' +
        tz.toFixed(2) +
        ')'
    )
  })

  clock = new THREE.Clock()

  const fbxLoader = new FBXLoader()
  fbxLoader.load(
    '/models/greetings.fbx',
    async (object) => {
      scene.add(object)

      if (object.animations?.length) {
        mixer = new THREE.AnimationMixer(object)
        const action = mixer.clipAction(object.animations[0])
        action.setLoop(THREE.LoopBackwards, 2)
        action.clampWhenFinished = true
        action.play()
      }

      await renderer.compileAsync(scene, camera)
      await new Promise((r) => requestAnimationFrame(r))
      modelLoading.value = false
    },
    async (xhr) => {
      if (xhr.lengthComputable) {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
      }

      if (xhr.loaded === xhr.total) {
        for (const { text, ref } of texts) {
          await nextTick()
          await typeText(text, ref)
        }     
      }
    },
    (error) => {
      console.error('FBX load error:', error)
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

