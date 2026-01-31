<template>
  <div ref="containerRef" class="relative w-full h-full overflow-hidden rounded-xl">
    <canvas ref="canvasRef" class="w-full h-full outline-none"/>
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

useHead({
  title: "3D Text Lesson",
  meta: [{ name: "description", content: "3D Text Lesson" }],
});

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

  const matcapTextures = [
    textureLoader.load('/textures/matcaps/1.png'),
    textureLoader.load('/textures/matcaps/2.png'),
    textureLoader.load('/textures/matcaps/3.png'),
    textureLoader.load('/textures/matcaps/4.png'),
    textureLoader.load('/textures/matcaps/5.png'),
    textureLoader.load('/textures/matcaps/6.png'),
    textureLoader.load('/textures/matcaps/7.png'),
    textureLoader.load('/textures/matcaps/8.png'),

  ]
  matcapTextures.forEach(texture => {
    texture.colorSpace = THREE.SRGBColorSpace
  })
  material = new THREE.MeshMatcapMaterial({ matcap: matcapTextures[7] })

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
      material.matcap = matcapTextures[value - 1]
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

  const tick = () => {
    controls.update()
    renderer.render(scene, camera)
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
})
</script>
