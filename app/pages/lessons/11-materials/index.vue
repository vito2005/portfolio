<template>
  <div ref="containerRef" class="flex-1 min-h-0 relative w-full overflow-hidden rounded-xl">
    <canvas ref="canvasRef" class="w-full h-full outline-none" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { useLesson } from '@/composables/three-js-lessons/useLesson'

definePageMeta({
  layout: "lessons",
});

const route = useRoute()
const url = useRequestURL()
const canonicalUrl = url.origin + route.path

const seoTitle = 'Materials — Three.js Lesson | Alex Buki Developer'
const seoDescription =
  'Learn to create and use materials in Three.js: MeshStandardMaterial, MeshPhysicalMaterial, and more. Interactive lesson with live controls.'

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

onMounted(() => {
  if (!canvasRef.value) return

  const lessonData = useLesson(canvasRef, containerRef)
  const { camera, scene, controls, renderer, gui, hdrLoader } = lessonData

  gui.domElement.style.position = 'absolute'
  gui.domElement.style.top = '0'
  gui.domElement.style.right = '0'

  /**
   * Environment map
   */
  hdrLoader.load('/textures/environmentMap/2k.hdr', (environmentMap) => {
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.background = environmentMap
    scene.environment = environmentMap
  })

  /**
   * MeshPhysicalMaterial
   */
  // Base material
  const material = new THREE.MeshPhysicalMaterial()
  material.metalness = 0
  material.roughness = 0.15

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
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 64, 64),
    material
  )
  sphere.position.x = - 1.5

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, 100, 100),
    material
  )

  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.2, 64, 128),
    material
  )
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
    window.requestAnimationFrame(tick)
  }

  tick()

  return () => {
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
  }

})
</script>
