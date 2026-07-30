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
import { Sky } from 'three/addons/objects/Sky.js'
import { useLesson } from '@/composables/three-js-lessons/useLesson'

definePageMeta({
  layout: "lessons",
});

const route = useRoute()
const url = useRequestURL()
const canonicalUrl = url.origin + route.path

const seoTitle = 'Haunted House — Three.js Lesson | Alex Buki Developer'
const seoDescription =
  'Build a haunted house scene with Three.js: textured walls, roof, door, graves, ghosts, shadows, sky and fog.'

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
let initialLoadTimeoutId

onMounted(() => {
  if (!canvasRef.value || !containerRef.value) return

  const lessonData = useLesson(canvasRef, containerRef)
  const { camera, scene, renderer: lessonRenderer, controls: lessonControls, gui: lessonGui, textureLoader } = lessonData
  renderer = lessonRenderer
  controls = lessonControls
  gui = lessonGui

  let pendingTextures = 5
  const markTextureLoaded = () => {
    pendingTextures -= 1
    if (pendingTextures <= 0) {
      if (initialLoadTimeoutId) clearTimeout(initialLoadTimeoutId)
      isLoading.value = false
    }
  }

  initialLoadTimeoutId = window.setTimeout(() => {
    isLoading.value = false
  }, 8000)

  gui.domElement.style.position = 'absolute'
  gui.domElement.style.top = '0'
  gui.domElement.style.right = '0'

  /**
   * Textures
   */
  // Floor
  const floorAlphaTexture = textureLoader.load('/textures/floor/alpha.webp')
  const floorColorTexture = textureLoader.load('/textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_diff_1k.webp', markTextureLoaded)
  const floorARMTexture = textureLoader.load('/textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_arm_1k.webp')
  const floorNormalTexture = textureLoader.load('/textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_nor_gl_1k.webp')
  const floorDisplacementTexture = textureLoader.load('/textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_disp_1k.webp')

  floorColorTexture.colorSpace = THREE.SRGBColorSpace

  for (const t of [floorColorTexture, floorARMTexture, floorNormalTexture, floorDisplacementTexture]) {
    t.repeat.set(8, 8)
    t.wrapS = THREE.RepeatWrapping
    t.wrapT = THREE.RepeatWrapping
  }

  // Wall
  const wallColorTexture = textureLoader.load('/textures/wall/castle_brick_broken_06_1k/castle_brick_broken_06_diff_1k.webp', markTextureLoaded)
  const wallARMTexture = textureLoader.load('/textures/wall/castle_brick_broken_06_1k/castle_brick_broken_06_arm_1k.webp')
  const wallNormalTexture = textureLoader.load('/textures/wall/castle_brick_broken_06_1k/castle_brick_broken_06_nor_gl_1k.webp')

  wallColorTexture.colorSpace = THREE.SRGBColorSpace

  // Roof
  const roofColorTexture = textureLoader.load('/textures/roof/roof_slates_02_1k/roof_slates_02_diff_1k.webp', markTextureLoaded)
  const roofARMTexture = textureLoader.load('/textures/roof/roof_slates_02_1k/roof_slates_02_arm_1k.webp')
  const roofNormalTexture = textureLoader.load('/textures/roof/roof_slates_02_1k/roof_slates_02_nor_gl_1k.webp')

  roofColorTexture.colorSpace = THREE.SRGBColorSpace

  for (const t of [roofColorTexture, roofARMTexture, roofNormalTexture]) {
    t.repeat.set(3, 1)
    t.wrapS = THREE.RepeatWrapping
  }

  // Bush
  const bushColorTexture = textureLoader.load('/textures/bush/leaves_forest_ground_1k/leaves_forest_ground_diff_1k.webp')
  const bushARMTexture = textureLoader.load('/textures/bush/leaves_forest_ground_1k/leaves_forest_ground_arm_1k.webp')
  const bushNormalTexture = textureLoader.load('/textures/bush/leaves_forest_ground_1k/leaves_forest_ground_nor_gl_1k.webp')

  bushColorTexture.colorSpace = THREE.SRGBColorSpace

  for (const t of [bushColorTexture, bushARMTexture, bushNormalTexture]) {
    t.repeat.set(2, 1)
    t.wrapS = THREE.RepeatWrapping
  }

  // Grave
  const graveColorTexture = textureLoader.load('/textures/grave/plastered_stone_wall_1k/plastered_stone_wall_diff_1k.webp')
  const graveARMTexture = textureLoader.load('/textures/grave/plastered_stone_wall_1k/plastered_stone_wall_arm_1k.webp')
  const graveNormalTexture = textureLoader.load('/textures/grave/plastered_stone_wall_1k/plastered_stone_wall_nor_gl_1k.webp')

  graveColorTexture.colorSpace = THREE.SRGBColorSpace

  graveColorTexture.repeat.set(0.3, 0.4)
  graveARMTexture.repeat.set(0.3, 0.4)
  graveNormalTexture.repeat.set(0.3, 0.4)

  // Door
  const doorColorTexture = textureLoader.load('/textures/door/color.webp', markTextureLoaded)
  const doorAlphaTexture = textureLoader.load('/textures/door/alpha.webp')
  const doorAmbientOcclusionTexture = textureLoader.load('/textures/door/ambientOcclusion.webp')
  const doorHeightTexture = textureLoader.load('/textures/door/height.webp')
  const doorNormalTexture = textureLoader.load('/textures/door/normal.webp', markTextureLoaded)
  const doorMetalnessTexture = textureLoader.load('/textures/door/metalness.webp')
  const doorRoughnessTexture = textureLoader.load('/textures/door/roughness.webp')

  doorColorTexture.colorSpace = THREE.SRGBColorSpace

  /**
   * House
   */
  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20, 100, 100),
    new THREE.MeshStandardMaterial({
      alphaMap: floorAlphaTexture,
      transparent: true,
      map: floorColorTexture,
      aoMap: floorARMTexture,
      roughnessMap: floorARMTexture,
      metalnessMap: floorARMTexture,
      normalMap: floorNormalTexture,
      displacementMap: floorDisplacementTexture,
      displacementScale: 0.3,
      displacementBias: -0.2
    })
  )
  floor.rotation.x = -Math.PI * 0.5
  scene.add(floor)

  gui.add(floor.material, 'displacementScale').min(0).max(1).step(0.001).name('floorDisplacementScale')
  gui.add(floor.material, 'displacementBias').min(-1).max(1).step(0.001).name('floorDisplacementBias')

  // House container
  const house = new THREE.Group()
  scene.add(house)

  // Walls
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2.5, 4),
    new THREE.MeshStandardMaterial({
      map: wallColorTexture,
      aoMap: wallARMTexture,
      roughnessMap: wallARMTexture,
      metalnessMap: wallARMTexture,
      normalMap: wallNormalTexture
    })
  )
  walls.position.y += 1.25
  house.add(walls)

  // Roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 1.5, 4),
    new THREE.MeshStandardMaterial({
      map: roofColorTexture,
      aoMap: roofARMTexture,
      roughnessMap: roofARMTexture,
      metalnessMap: roofARMTexture,
      normalMap: roofNormalTexture
    })
  )
  roof.position.y = 2.5 + 0.75
  roof.rotation.y = Math.PI * 0.25
  house.add(roof)

  // Door
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.2, 100, 100),
    new THREE.MeshStandardMaterial({
      map: doorColorTexture,
      transparent: true,
      alphaMap: doorAlphaTexture,
      aoMap: doorAmbientOcclusionTexture,
      displacementMap: doorHeightTexture,
      displacementScale: 0.15,
      displacementBias: -0.04,
      normalMap: doorNormalTexture,
      metalnessMap: doorMetalnessTexture,
      roughnessMap: doorRoughnessTexture
    })
  )
  door.position.y = 1
  door.position.z = 2 + 0.01
  house.add(door)

  // Bushes
  const bushGeometry = new THREE.SphereGeometry(1, 16, 16)
  const bushMaterial = new THREE.MeshStandardMaterial({
    color: '#ccffcc',
    map: bushColorTexture,
    aoMap: bushARMTexture,
    roughnessMap: bushARMTexture,
    metalnessMap: bushARMTexture,
    normalMap: bushNormalTexture
  })

  const bush1 = new THREE.Mesh(bushGeometry, bushMaterial)
  bush1.scale.set(0.5, 0.5, 0.5)
  bush1.position.set(0.8, 0.2, 2.2)
  bush1.rotation.x = -0.75

  const bush2 = new THREE.Mesh(bushGeometry, bushMaterial)
  bush2.scale.set(0.25, 0.25, 0.25)
  bush2.position.set(1.4, 0.1, 2.1)
  bush2.rotation.x = -0.75

  const bush3 = new THREE.Mesh(bushGeometry, bushMaterial)
  bush3.scale.set(0.4, 0.4, 0.4)
  bush3.position.set(-0.8, 0.1, 2.2)
  bush3.rotation.x = -0.75

  const bush4 = new THREE.Mesh(bushGeometry, bushMaterial)
  bush4.scale.set(0.15, 0.15, 0.15)
  bush4.position.set(-1, 0.05, 2.6)
  bush4.rotation.x = -0.75

  house.add(bush1, bush2, bush3, bush4)

  // Graves
  const graveWidth = 0.6
  const graveHeight = 0.8
  const graveThickness = 0.2

  const graveGeometry = new THREE.BoxGeometry(graveWidth, graveHeight, graveThickness)
  const graveMaterial = new THREE.MeshStandardMaterial({
    map: graveColorTexture,
    normalMap: graveNormalTexture,
    aoMap: graveARMTexture,
    roughnessMap: graveARMTexture,
    metalnessMap: graveARMTexture
  })

  const graves = new THREE.Group()
  scene.add(graves)

  /**
   * Inscriptions
   */
  const inscriptionVariantCount = 24
  const carvedLetterColor = '#241f19'
  const carvedGrooveDepth = 1.4
  const inscriptionOffsetFromFace = 0.002

  const inscriptionGeometry = new THREE.PlaneGeometry(graveWidth, graveHeight)
  const inscriptionMaterials = []

  for (let variant = 1; variant <= inscriptionVariantCount; variant++) {
    const epitaph = String(variant).padStart(2, '0')

    inscriptionMaterials.push(new THREE.MeshStandardMaterial({
      color: carvedLetterColor,
      transparent: true,
      alphaMap: textureLoader.load(`/textures/grave/inscription/${epitaph}_alpha.webp`),
      normalMap: textureLoader.load(`/textures/grave/inscription/${epitaph}_normal.webp`),
      normalScale: new THREE.Vector2(carvedGrooveDepth, carvedGrooveDepth),
      roughness: 1,
      metalness: 0,
      depthWrite: false
    }))
  }

  const inscriptions = []

  for (let i = 0; i < 30; i++) {
    const angleAroundHouse = Math.random() * Math.PI * 2
    const radius = 3 + Math.random() * 4
    const inscribedFaceAimedAwayFromHouse = angleAroundHouse

    const grave = new THREE.Mesh(graveGeometry, graveMaterial)
    grave.position.x = Math.sin(angleAroundHouse) * radius
    grave.position.y = Math.random() * 0.4
    grave.position.z = Math.cos(angleAroundHouse) * radius
    grave.rotation.x = (Math.random() - 0.5) * 0.4
    grave.rotation.y = inscribedFaceAimedAwayFromHouse + (Math.random() - 0.5) * 0.4
    grave.rotation.z = (Math.random() - 0.5) * 0.4

    const inscription = new THREE.Mesh(inscriptionGeometry, inscriptionMaterials[i % inscriptionVariantCount])
    inscription.position.z = graveThickness * 0.5 + inscriptionOffsetFromFace
    inscription.receiveShadow = true

    grave.add(inscription)
    inscriptions.push(inscription)
    graves.add(grave)
  }

  gui.add({ inscriptions: true }, 'inscriptions').onChange((value) => {
    for (const inscription of inscriptions) inscription.visible = value
  })

  /**
   * Lights
   */
  const ambientLight = new THREE.AmbientLight('#86cdff', 0.275)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight('#86cdff', 1)
  directionalLight.position.set(3, 2, -8)
  scene.add(directionalLight)

  const doorLight = new THREE.PointLight('#ff7d46', 5)
  doorLight.position.set(0, 2.2, 2.5)
  house.add(doorLight)

  /**
   * Ghosts
   */
  const ghosts = [
    { color: '#8800ff', radius: 4, speed: 0.5, phase: 0 },
    { color: '#ff0088', radius: 5, speed: -0.38, phase: 1.05 },
    { color: '#ff0000', radius: 6, speed: 0.23, phase: 2.1 },
    { color: '#00b3ff', radius: 4.5, speed: -0.62, phase: 3.14 },
    { color: '#37ff8b', radius: 5.5, speed: 0.44, phase: 4.19 },
    { color: '#ffb347', radius: 6.5, speed: -0.29, phase: 5.24 }
  ].map(ghost => ({ ...ghost, light: new THREE.PointLight(ghost.color, 6) }))

  scene.add(...ghosts.map(ghost => ghost.light))

  /**
   * Shadows
   */
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  directionalLight.castShadow = true

  walls.castShadow = true
  walls.receiveShadow = true
  roof.castShadow = true
  floor.receiveShadow = true

  for (const grave of graves.children) {
    grave.castShadow = true
    grave.receiveShadow = true
  }

  directionalLight.shadow.mapSize.width = 256
  directionalLight.shadow.mapSize.height = 256
  directionalLight.shadow.camera.top = 8
  directionalLight.shadow.camera.right = 8
  directionalLight.shadow.camera.bottom = -8
  directionalLight.shadow.camera.left = -8
  directionalLight.shadow.camera.near = 1
  directionalLight.shadow.camera.far = 20

  const shadowCastingGhostCount = 3

  for (const { light } of ghosts.slice(0, shadowCastingGhostCount)) {
    light.castShadow = true
    light.shadow.mapSize.width = 256
    light.shadow.mapSize.height = 256
    light.shadow.camera.far = 10
  }

  /**
   * Sky
   */
  const sky = new Sky()
  sky.scale.set(100, 100, 100)
  scene.add(sky)

  sky.material.uniforms['turbidity'].value = 10
  sky.material.uniforms['rayleigh'].value = 3
  sky.material.uniforms['mieCoefficient'].value = 0.1
  sky.material.uniforms['mieDirectionalG'].value = 0.95
  sky.material.uniforms['sunPosition'].value.set(0.3, -0.038, -0.95)

  /**
   * Fog
   */
  scene.fog = new THREE.FogExp2('#04343f', 0.1)

  gui.add(scene.fog, 'density').min(0).max(0.5).step(0.001).name('fogDensity')

  /**
   * Camera
   */
  camera.position.x = 4
  camera.position.y = 2
  camera.position.z = 5
  controls.enableDamping = true

  /**
   * Animate
   */
  const clock = new THREE.Clock()

  const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    for (const { light, radius, speed, phase } of ghosts) {
      const angle = elapsedTime * speed + phase

      light.position.x = Math.cos(angle) * radius
      light.position.z = Math.sin(angle) * radius
      light.position.y = Math.sin(angle) * Math.sin(angle * 2.34) * Math.sin(angle * 3.45)
    }

    controls.update()
    renderer.render(scene, camera)
    animationId = window.requestAnimationFrame(tick)
  }

  tick()
})

onUnmounted(() => {
  if (initialLoadTimeoutId) {
    clearTimeout(initialLoadTimeoutId)
  }
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
