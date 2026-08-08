import {
  DirectionalLight,
  Fog,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import { createCanvasTexture } from '../../../shared/textures.js'

const BACKGROUND = 0x141a2c

/** Three draws a plain texture as a screen-aligned quad, so this is the backdrop. */
function createBackgroundTexture() {
  const texture = createCanvasTexture(2, 256, (context, canvas) => {
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#2a2f57')
    gradient.addColorStop(0.6, '#1a2038')
    gradient.addColorStop(1, '#141a2c')
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
  })

  texture.colorSpace = SRGBColorSpace
  return texture
}

/**
 * Renderer, camera and lights.
 *
 * Unlike the runners, the camera here never moves — it only has to frame the
 * whole rack, on any screen shape, without cropping a slot.
 */
export function createScene(canvas) {
  const scene = new Scene()
  scene.background = createBackgroundTexture()
  scene.fog = new Fog(BACKGROUND, 14, 30)

  const camera = new PerspectiveCamera(50, 1, 0.1, 40)

  const renderer = new WebGLRenderer({
    canvas,
    // A 2x+ phone screen already hides the aliasing; MSAA only pays off on desktop.
    antialias: window.devicePixelRatio < 2,
    powerPreference: 'high-performance',
    alpha: false,
  })

  renderer.shadowMap.enabled = false

  scene.add(new HemisphereLight(0xc9dbff, 0x241f3a, 1.15))

  const sun = new DirectionalLight(0xfff1e0, 1.7)
  sun.position.set(3, 6, 7)
  scene.add(sun)

  let qualityScale = 1
  // What the camera has to fit vertically, set once the board knows its size.
  let framedHeight = 8
  let framedWidth = 5

  function applySize() {
    const width = window.innerWidth
    const height = window.innerHeight
    const aspect = width / height

    camera.aspect = aspect

    // Distance that fits the rack vertically, and the distance that fits it
    // horizontally — whichever is further away is the one that shows all of it.
    const vertical = (framedHeight / 2) / Math.tan((camera.fov * Math.PI) / 360)
    const horizontal = (framedWidth / 2) / (Math.tan((camera.fov * Math.PI) / 360) * aspect)

    camera.position.set(0, 0, Math.max(vertical, horizontal) + 1.6)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * qualityScale)
    renderer.setSize(width, height, false)
  }

  /** Told by the board how big the rack is, so the camera can frame it. */
  function frameContent(contentWidth, contentHeight) {
    framedWidth = contentWidth
    framedHeight = contentHeight
    applySize()
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

  return { scene, camera, renderer, trackPerformance, frameContent }
}
