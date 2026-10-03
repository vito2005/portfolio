import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { heroStack } from '@/data/profile'

/**
 * The hero's "workplace": a bar-height table on one leg and an open laptop on it,
 * both built from primitives so they cost no download, need no licence credit
 * and take the site's colours, and the code screen the laptop shows. Together they say "programmer"
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
// to read as coloured lines first and as text only up close. The stack is the hero's
// tag row, two names per line.
const STACK_LINES = Array.from({ length: Math.ceil(heroStack.length / 2) }, (_, row) =>
  `    ${heroStack.slice(row * 2, row * 2 + 2).map(name => `'${name}'`).join(', ')},`)
const CODE_LINES = [
  { text: 'const alex = {', color: '#e6e1d8' },
  { text: '  stack: [', color: '#e6e1d8' },
  ...STACK_LINES.map(text => ({ text, color: '#7fd8b6' })),
  { text: '  ],', color: '#e6e1d8' },
  { text: '}', color: '#e6e1d8' },
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

const ALUMINIUM = '#c8cacd'
const KEYBOARD = '#2a2a2c'

/**
 * An open, MacBook-like laptop: rounded aluminium base with a dark keyboard well
 * and a trackpad, and a lid opened a little past upright, its screen showing the
 * code canvas. Built 1 unit wide, keyboard towards +z, screen facing +z; the
 * caller scales it. The group's origin is at the centre of the base's underside.
 */
export function createLaptop(screenTexture: THREE.Texture): THREE.Group {
  const laptop = new THREE.Group()
  const width = 1
  const depth = 0.7
  const baseHeight = 0.035
  const lidThickness = 0.022

  const metal = new THREE.MeshStandardMaterial({ color: ALUMINIUM, roughness: 0.38, metalness: 0.25 })
  const dark = new THREE.MeshStandardMaterial({ color: KEYBOARD, roughness: 0.7 })
  const pad = new THREE.MeshStandardMaterial({ color: '#b9bbbf', roughness: 0.3, metalness: 0.2 })

  const base = new THREE.Mesh(new RoundedBoxGeometry(width, baseHeight, depth, 3, 0.012), metal)
  base.position.y = baseHeight / 2

  // Keyboard well and trackpad: thin slabs just proud of the top face.
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.002, depth * 0.4), dark)
  keyboard.position.set(0, baseHeight + 0.001, -depth * 0.12)
  const trackpad = new THREE.Mesh(new THREE.BoxGeometry(width * 0.36, 0.002, depth * 0.26), pad)
  trackpad.position.set(0, baseHeight + 0.001, depth * 0.3)

  // The lid hinges on the base's back edge and leans back ~15° past upright.
  const hinge = new THREE.Group()
  hinge.position.set(0, baseHeight, -depth / 2 + lidThickness / 2)
  hinge.rotation.x = -0.26
  const lid = new THREE.Mesh(new RoundedBoxGeometry(width, depth, lidThickness, 3, 0.01), metal)
  lid.position.y = depth / 2
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.97, depth * 0.95), new THREE.MeshBasicMaterial({ color: '#111111' }))
  bezel.position.set(0, depth / 2, lidThickness / 2 + 0.0006)
  // The screen keeps the code canvas's 1.48:1 and glows (unlit, no tone mapping).
  const screenWidth = width * 0.9
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(screenWidth, screenWidth / 1.48),
    new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }),
  )
  screen.position.set(0, depth / 2 + depth * 0.02, lidThickness / 2 + 0.0012)
  hinge.add(lid, bezel, screen)

  laptop.add(base, keyboard, trackpad, hinge)
  return laptop
}
