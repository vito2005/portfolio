import * as THREE from 'three'

/**
 * The hero's "workplace": a bar-height table on one leg, built
 * from primitives so it costs no download and takes the site's colours, and a
 * code screen for the laptop that stands on it. Together they say "programmer"
 * at a glance, which the avatar alone did not.
 *
 * Sizes are in avatar units: the avatar is 2 units tall, so 1 unit ≈ 0.9 m.
 */

/** Height of the tabletop surface: about elbow height on the avatar. */
export const TABLE_TOP_Y = 1.08
const TOP_RADIUS = 0.3
const TOP_THICKNESS = 0.035

const WOOD = '#d8b48a'
const WOOD_EDGE = '#c49a6c'
const STEEL = '#2b2a28'

/**
 * A round bar table: wooden top, dark pole and a heavy disc base. No foot ring: with
 * one the silhouette read as a bar stool. The group's origin is on the floor under
 * the pole.
 */
export function createBarTable(): THREE.Group {
  const table = new THREE.Group()
  const wood = new THREE.MeshStandardMaterial({ color: WOOD, roughness: 0.55 })
  const woodEdge = new THREE.MeshStandardMaterial({ color: WOOD_EDGE, roughness: 0.6 })
  const steel = new THREE.MeshStandardMaterial({ color: STEEL, roughness: 0.45, metalness: 0.2 })

  // Side, top and bottom of the cylinder take different materials: a darker edge
  // band gives the slab a visible thickness under the flat lighting.
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(TOP_RADIUS, TOP_RADIUS, TOP_THICKNESS, 64),
    [woodEdge, wood, wood],
  )
  top.position.y = TABLE_TOP_Y - TOP_THICKNESS / 2

  const poleHeight = TABLE_TOP_Y - TOP_THICKNESS
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, poleHeight, 24), steel)
  pole.position.y = poleHeight / 2

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.03, 48), steel)
  base.position.y = 0.015

  table.add(top, pole, base)
  return table
}

// Short lines in a big font: at hero size the screen is ~80 px wide, so the code has
// to read as coloured lines first and as text only up close.
const CODE_LINES = [
  { text: 'const alex = {', color: '#e6e1d8' },
  { text: '  role: \'web dev\',', color: '#7fd8b6' },
  { text: '  stack: [\'Vue\', \'Go\', \'3D\'],', color: '#e6e1d8' },
  { text: '}', color: '#e6e1d8' },
  { text: '', color: '#e6e1d8' },
  { text: 'ship()', color: '#f2c27b' },
]
const TYPE_SPEED = 28 // characters per second
const HOLD_S = 3 // pause on the finished code before it types again

export interface CodeScreen {
  texture: THREE.CanvasTexture
  /** Redraws the screen for the given clock time; cheap, only when the text changes. */
  update: (elapsed: number) => void
  dispose: () => void
}

/**
 * A dark editor screen that types the code above line by line, then holds and
 * starts over. Drawn on a canvas; the texture is re-uploaded only when another
 * character appears or the cursor blinks.
 */
export function createCodeScreen(): CodeScreen {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 346 // the screen quad is 1.48:1
  const context = canvas.getContext('2d')!
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4

  const totalChars = CODE_LINES.reduce((sum, line) => sum + line.text.length + 1, 0)
  const cycle = totalChars / TYPE_SPEED + HOLD_S
  let lastKey = ''

  function draw(typed: number, cursorOn: boolean) {
    context.fillStyle = '#1d1c1a'
    context.fillRect(0, 0, canvas.width, canvas.height)
    // Editor chrome: three window dots and a thin accent line under the tab bar.
    for (const [index, color] of ['#e86f5a', '#e8c15a', '#6fc27a'].entries()) {
      context.fillStyle = color
      context.beginPath()
      context.arc(22 + index * 18, 18, 5, 0, Math.PI * 2)
      context.fill()
    }
    context.fillStyle = '#12b488'
    context.fillRect(0, 34, canvas.width, 2)

    context.font = '24px ui-monospace, Menlo, monospace'
    context.textBaseline = 'top'
    let remaining = typed
    let cursorX = 20
    let cursorY = 56
    for (const [index, line] of CODE_LINES.entries()) {
      if (remaining <= 0) {
        break
      }
      const visible = line.text.slice(0, Math.min(line.text.length, remaining))
      const y = 56 + index * 36
      context.fillStyle = '#5c5952'
      context.fillText(String(index + 1).padStart(2, ' '), 8, y)
      context.fillStyle = line.color
      context.fillText(visible, 44, y)
      cursorX = 44 + context.measureText(visible).width
      cursorY = y
      remaining -= line.text.length + 1
    }
    if (cursorOn) {
      context.fillStyle = '#12b488'
      context.fillRect(cursorX + 3, cursorY + 2, 12, 24)
    }
    texture.needsUpdate = true
  }

  function update(elapsed: number) {
    const t = elapsed % cycle
    const typed = Math.min(totalChars, Math.floor(t * TYPE_SPEED))
    const cursorOn = Math.floor(elapsed * 2) % 2 === 0
    const key = `${typed}:${cursorOn}`
    if (key !== lastKey) {
      lastKey = key
      draw(typed, cursorOn)
    }
  }

  update(0)
  return { texture, update, dispose: () => texture.dispose() }
}

/**
 * The laptop model's screen quad samples only a window of its original texture
 * (u 0.27–0.71, v 0.23–0.81). Stretch its UVs over the whole square so the code
 * canvas fills the screen edge to edge.
 */
export function fitScreenUvs(geometry: THREE.BufferGeometry) {
  const uv = geometry.getAttribute('uv')
  if (!uv) {
    return
  }
  let minU = Infinity
  let minV = Infinity
  let maxU = -Infinity
  let maxV = -Infinity
  for (let index = 0; index < uv.count; index++) {
    minU = Math.min(minU, uv.getX(index))
    maxU = Math.max(maxU, uv.getX(index))
    minV = Math.min(minV, uv.getY(index))
    maxV = Math.max(maxV, uv.getY(index))
  }
  for (let index = 0; index < uv.count; index++) {
    uv.setXY(index, (uv.getX(index) - minU) / (maxU - minU), (uv.getY(index) - minV) / (maxV - minV))
  }
  uv.needsUpdate = true
}
