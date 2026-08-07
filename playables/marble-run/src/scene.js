import {
  DirectionalLight,
  Fog,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import { createCanvasTexture } from './textures.js'

const BACKGROUND = 0x141d33

/** Three draws a plain texture as a screen-aligned quad, so this is the sky. */
function createBackgroundTexture() {
  const texture = createCanvasTexture(2, 256, (context, canvas) => {
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#3a2467')
    gradient.addColorStop(0.45, '#1e2649')
    gradient.addColorStop(1, '#141d33')
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
  })

  texture.colorSpace = SRGBColorSpace
  return texture
}

/**
 * Renderer, camera and lights.
 *
 * A playable owns the whole viewport, so unlike a page-embedded scene,
 * `window.innerWidth/innerHeight` is the right source of truth here.
 */
export function createScene(canvas) {
  const scene = new Scene()
  scene.background = createBackgroundTexture()
  // Hides the far end of the track and stops distant blocks popping in.
  scene.fog = new Fog(BACKGROUND, 18, 38)

  const camera = new PerspectiveCamera(55, 1, 0.1, 50)

  const renderer = new WebGLRenderer({
    canvas,
    // A 2x+ phone screen already hides the aliasing; MSAA only pays off on desktop.
    antialias: window.devicePixelRatio < 2,
    powerPreference: 'high-performance',
    alpha: false,
  })

  renderer.shadowMap.enabled = false

  const hemisphere = new HemisphereLight(0x9fc6ff, 0x2a1a4a, 1.15)
  scene.add(hemisphere)

  const sun = new DirectionalLight(0xfff0d8, 1.9)
  sun.position.set(3, 8, 4)
  scene.add(sun)

  /** Scales resolution down once if the device can't hold the frame rate. */
  let qualityScale = 1
  let baseFov = 55
  let fovOffset = 0

  function applySize() {
    const width = window.innerWidth
    const height = window.innerHeight
    const aspect = width / height

    // Portrait needs a wider field to keep the next obstacle on screen.
    baseFov = aspect < 1 ? 64 : 48
    camera.fov = baseFov + fovOffset
    camera.aspect = aspect
    camera.updateProjectionMatrix()

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * qualityScale)
    renderer.setSize(width, height, false)
  }

  applySize()
  window.addEventListener('resize', applySize)
  window.addEventListener('orientationchange', applySize)

  let sampleCount = 0
  let sampleTime = 0

  /** One shot: under ~45 fps for two seconds, drop resolution and stop measuring. */
  function trackPerformance(delta) {
    if (qualityScale < 1) {
      return
    }
    sampleCount += 1
    sampleTime += delta
    if (sampleCount < 120) {
      return
    }
    if (sampleTime / sampleCount > 0.022) {
      qualityScale = 0.75
      applySize()
    }
    sampleCount = 0
    sampleTime = 0
  }

  /** Widens the view as the marble speeds up, skipping invisible changes. */
  function setFovOffset(offset) {
    if (Math.abs(offset - fovOffset) < 0.05) {
      return
    }
    fovOffset = offset
    camera.fov = baseFov + fovOffset
    camera.updateProjectionMatrix()
  }

  return { scene, camera, renderer, trackPerformance, setFovOffset }
}
