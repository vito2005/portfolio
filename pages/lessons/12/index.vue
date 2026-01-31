<template>
  <div ref="containerRef" class="flex-1 min-h-0 relative w-full overflow-hidden rounded-xl">
    <canvas ref="canvasRef" class="w-full h-full outline-none" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { useLesson } from '@/composables/three-js-lessons/useLesson'

definePageMeta({
  layout: "lessons",
});

const route = useRoute()
const url = useRequestURL()
const canonicalUrl = url.origin + route.path

const seoTitle = '3D Text — Three.js Lesson | Alex Buki Developer'
const seoDescription =
  'Learn to create 3D text with Three.js: TextGeometry, matcap materials, and custom fonts. Interactive lesson with live controls.'

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

let animationId
let textMesh
let material

const fonts = {
  Sora: null,
  Helvetiker: null
}

const parameters = {
  text: 'Alex Buki',
  fontSize: 0.5,
  fontType: 'Sora',
  matcapTexture: 8
}

onMounted(() => {
  if (!canvasRef.value) return

  const lessonData = useLesson(canvasRef, containerRef)
  const { camera, scene, textureLoader, fontLoader, controls, renderer, gui } = lessonData

  gui.domElement.style.position = 'absolute'
    gui.domElement.style.top = '0'
    gui.domElement.style.right = '0'

  const matcapTextures = new Array(8).fill(null)

  textureLoader.load('/textures/matcaps/8.png', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    matcapTextures[7] = texture
    material = new THREE.MeshMatcapMaterial({ matcap: texture })
    initScene()
  })

  function initScene() {

  const updateText = () => {
    if (textMesh) {
      scene.remove(textMesh)
      textMesh.geometry.dispose()
    }

    const selectedFont = fonts[parameters.fontType]
    if (!selectedFont) return

    const textGeometry = new TextGeometry(parameters.text, {
      font: selectedFont,
      size: parameters.fontSize,
      depth: 0.2,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 5,
    })
    textGeometry.center()

    textMesh = new THREE.Mesh(textGeometry, material)
    scene.add(textMesh)
  }

  fontLoader.load(
    '/fonts/Sora_Regular.json',
    (font) => {
      fonts.Sora = font
      if (parameters.fontType === 'Sora') {
        updateText()
      }
    }
  )

  fontLoader.load(
    '/fonts/helvetiker_regular.typeface.json',
    (font) => {
      fonts.Helvetiker = font
      if (parameters.fontType === 'Helvetiker') {
        updateText()
      }
    }
  )

  gui.add(parameters, 'text')
    .name('Text')
    .onChange(updateText)

  gui.add(parameters, 'matcapTexture', matcapTextures.map((_, index) => index + 1))
    .name('Matcap Texture')
    .onChange((value) => {
      const tex = matcapTextures[value - 1]
      if (tex) material.matcap = tex
    })

  gui.add(parameters, 'fontSize')
    .min(0.1)
    .max(2)
    .step(0.1)
    .name('Font Size')
    .onChange(updateText)

  gui.add(parameters, 'fontType', ['Sora', 'Helvetiker'])
    .name('Font Type')
    .onChange(updateText)

  const donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 32, 64)

  for (let i = 0; i < 100; i++) {
    const donut = new THREE.Mesh(donutGeometry, material)
    donut.position.x = (Math.random() - 0.5) * 10
    donut.position.y = (Math.random() - 0.5) * 10
    donut.position.z = (Math.random() - 0.5) * 10
    donut.rotation.x = Math.random() * Math.PI
    donut.rotation.y = Math.random() * Math.PI
    const scale = Math.random()
    donut.scale.set(scale, scale, scale)

    scene.add(donut)
  }

  let firstFrameRendered = false

  const tick = () => {
    controls.update()
    renderer.render(scene, camera)

    if (!firstFrameRendered) {
      firstFrameRendered = true
      for (let i = 0; i < 7; i++) {
        textureLoader.load(`/textures/matcaps/${i + 1}.png`, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          matcapTextures[i] = tex
          if (parameters.matcapTexture === i + 1) material.matcap = tex
        })
      }
    }

    animationId = window.requestAnimationFrame(tick)
  }

  tick()

  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    if (gui) {
      gui.destroy()
    }
    if (textMesh) {
      scene.remove(textMesh)
      textMesh.geometry.dispose()
    }
    if (controls) {
      controls.dispose()
    }
    if (renderer) {
      renderer.dispose()
    }
  }
  }
})
</script>
