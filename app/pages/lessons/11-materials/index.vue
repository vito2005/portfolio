<template>
  <div ref="containerRef" class="flex-1 min-h-0 relative w-full overflow-hidden rounded-xl">
    <canvas ref="canvasRef" class="w-full h-full outline-none" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { useLesson } from '@/composables/three-js-lessons/useLesson'

definePageMeta({
  layout: "lessons",
});

useLessonSeo('11')

const canvasRef = ref(null)
const containerRef = ref(null)

// Three.js handles stay plain `let` (not refs) so onUnmounted can tear them down.
let animationId = 0
let renderer = null
let controls = null
let gui = null
let disposeLesson = null
let environmentTexture = null
let material = null
const geometries = []

onMounted(() => {
  if (!canvasRef.value || !containerRef.value) return

  const lessonData = useLesson(canvasRef, containerRef)
  const { camera, scene, hdrLoader } = lessonData
  renderer = lessonData.renderer
  controls = lessonData.controls
  gui = lessonData.gui
  disposeLesson = lessonData.disposeLesson

  /**
   * Environment map
   */
  hdrLoader.load('/textures/environmentMap/2k.hdr', (environmentMap) => {
    environmentTexture = environmentMap
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.background = environmentMap
    scene.environment = environmentMap
  })

  /**
   * MeshPhysicalMaterial
   */
  // Base material
  material = new THREE.MeshPhysicalMaterial()
  material.metalness = 0
  material.roughness = 0.15
  // FrontSide on purpose: a double-sided transmissive material makes three render
  // its back faces into the very transmission buffer it samples, and WebGL floods
  // the console with "feedback loop" errors. The plane gets a mirrored twin below.
  material.side = THREE.FrontSide

  gui.add(material, 'metalness').min(0).max(1).step(0.0001)
  gui.add(material, 'roughness').min(0).max(1).step(0.0001)

  // Transmission
  material.transmission = 1
  material.ior = 1.5
  material.thickness = 0.5

  gui.add(material, 'transmission').min(0).max(1).step(0.0001)
  gui.add(material, 'ior').min(1).max(10).step(0.0001)
  gui.add(material, 'thickness').min(0).max(1).step(0.0001)

  // Objects
  const sphereGeometry = new THREE.SphereGeometry(0.5, 64, 64)
  const planeGeometry = new THREE.PlaneGeometry(1, 1, 100, 100)
  const torusGeometry = new THREE.TorusGeometry(0.3, 0.2, 64, 128)
  geometries.push(sphereGeometry, planeGeometry, torusGeometry)

  const sphere = new THREE.Mesh(sphereGeometry, material)
  sphere.position.x = - 1.5

  const plane = new THREE.Mesh(planeGeometry, material)
  // The plane's back face: a copy turned half a circle, so the glass sheet stays
  // visible from both sides while the material itself is single-sided.
  const planeBack = new THREE.Mesh(planeGeometry, material)
  planeBack.rotation.y = Math.PI
  plane.add(planeBack)

  const torus = new THREE.Mesh(torusGeometry, material)
  torus.position.x = 1.5

  scene.add(sphere, plane, torus)


  /**
   * Animate
   */
  const clock = new THREE.Clock()

  const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update objects
    sphere.rotation.y = 0.1 * elapsedTime
    plane.rotation.y = 0.1 * elapsedTime
    torus.rotation.y = 0.1 * elapsedTime

    sphere.rotation.x = - 0.15 * elapsedTime
    plane.rotation.x = - 0.15 * elapsedTime
    torus.rotation.x = - 0.15 * elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    animationId = window.requestAnimationFrame(tick)
  }

  tick()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  gui?.destroy()
  controls?.dispose()
  disposeLesson?.()
  for (const geometry of geometries) {
    geometry.dispose()
  }
  material?.dispose()
  environmentTexture?.dispose()
  renderer?.dispose()
})
</script>
