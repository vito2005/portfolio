import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshLambertMaterial,
  Vector3,
} from 'three'
import { CONFIG } from './config.js'

/**
 * Each kind has its own colour *and* its own silhouette. Colour alone would
 * make the puzzle unreadable for a colour-blind player, and shape reads faster
 * at thumbnail size anyway.
 */
export const KINDS = [
  { id: 'ruby', color: 0xff5d73, shape: 'box' },
  { id: 'mint', color: 0x2fd07a, shape: 'ball' },
  { id: 'sky', color: 0x4db5ff, shape: 'cone' },
  { id: 'gold', color: 0xffc247, shape: 'barrel' },
]

/**
 * Starting layout, one row per shelf. Hand-authored rather than shuffled: a
 * random board can be unsolvable, and in a twenty-second ad the player must
 * never lose to bad luck.
 */
const LAYOUT = [
  ['ruby', 'mint', 'sky'],
  ['mint', 'ruby', 'gold'],
  ['sky', 'gold', 'ruby'],
  ['mint', 'sky', 'gold'],
  [null, null, null],
]

const SHELF_COLOR = 0x2b3550
const FRAME_COLOR = 0x1d2439
const PAD_COLOR = 0x3b4870

function createItemGeometry(shape) {
  switch (shape) {
    case 'box':
      return new BoxGeometry(0.62, 0.62, 0.62)
    case 'ball':
      return new IcosahedronGeometry(0.4, 1)
    case 'cone':
      return new ConeGeometry(0.42, 0.75, 6)
    default:
      return new CylinderGeometry(0.35, 0.35, 0.7, 8)
  }
}

/**
 * The rack: shelves, one tappable pad per slot, and the items sitting on them.
 *
 * Slots are the model — an item always belongs to exactly one slot, and moving
 * is just swapping which slot holds it. Positions are derived, never stored
 * twice.
 */
export function createBoard(scene) {
  const group = new Group()
  scene.add(group)

  const geometries = []
  const materials = []
  const slots = []
  const items = []

  function material(color, extra) {
    const created = new MeshLambertMaterial({ color, flatShading: true, ...extra })
    materials.push(created)
    return created
  }

  const shelfMaterial = material(SHELF_COLOR)
  const frameMaterial = material(FRAME_COLOR)
  // A free slot is a translucent block, not a thin plate: it has to be both an
  // obvious 'you can drop here' and a target a thumb can actually hit.
  const padMaterial = material(PAD_COLOR, {
    transparent: true,
    opacity: 0.22,
    emissive: 0x4db5ff,
    emissiveIntensity: 0,
  })

  const rackWidth = CONFIG.slotsPerShelf * CONFIG.slotWidth
  const rackHeight = CONFIG.shelfCount * CONFIG.shelfGap

  /** World position of a slot — the single source of truth for placement. */
  function slotPosition(shelfIndex, slotIndex) {
    return new Vector3(
      (slotIndex - (CONFIG.slotsPerShelf - 1) / 2) * CONFIG.slotWidth,
      rackHeight / 2 - (shelfIndex + 0.5) * CONFIG.shelfGap + 0.42,
      0,
    )
  }

  /* Shelves and pads */

  const shelfGeometry = new BoxGeometry(rackWidth + 0.3, 0.16, 1)
  geometries.push(shelfGeometry)
  const padGeometry = new BoxGeometry(CONFIG.slotWidth * 0.78, 0.86, 0.78)
  geometries.push(padGeometry)

  for (let shelfIndex = 0; shelfIndex < CONFIG.shelfCount; shelfIndex += 1) {
    const board = new Mesh(shelfGeometry, shelfMaterial)
    const base = slotPosition(shelfIndex, 0)
    board.position.set(0, base.y - 0.36, 0)
    group.add(board)

    for (let slotIndex = 0; slotIndex < CONFIG.slotsPerShelf; slotIndex += 1) {
      const position = slotPosition(shelfIndex, slotIndex)

      // The pad is what an empty slot offers the raycaster to hit.
      const pad = new Mesh(padGeometry, padMaterial)
      pad.position.copy(position)
      group.add(pad)

      const slot = { shelfIndex, slotIndex, position, pad, item: null }
      pad.userData.slot = slot
      slots.push(slot)
    }
  }

  /* Side frames, purely to make the rack read as furniture */

  const frameGeometry = new BoxGeometry(0.18, rackHeight + 0.4, 1.1)
  geometries.push(frameGeometry)
  for (const side of [-1, 1]) {
    const frame = new Mesh(frameGeometry, frameMaterial)
    frame.position.set(side * (rackWidth / 2 + 0.24), 0, 0)
    group.add(frame)
  }

  /* Items */

  const itemGeometries = new Map()
  const itemMaterials = new Map()

  for (const kind of KINDS) {
    const geometry = createItemGeometry(kind.shape)
    geometries.push(geometry)
    itemGeometries.set(kind.id, geometry)
    itemMaterials.set(kind.id, material(kind.color))
  }

  function slotAt(shelfIndex, slotIndex) {
    return slots.find(slot => slot.shelfIndex === shelfIndex && slot.slotIndex === slotIndex)
  }

  LAYOUT.forEach((row, shelfIndex) => {
    row.forEach((kindId, slotIndex) => {
      if (!kindId) {
        return
      }

      const mesh = new Mesh(itemGeometries.get(kindId), itemMaterials.get(kindId))
      const slot = slotAt(shelfIndex, slotIndex)
      mesh.position.copy(slot.position)
      group.add(mesh)

      const item = { kindId, mesh, slot, cleared: false }
      mesh.userData.item = item
      slot.item = item
      items.push(item)
    })
  })

  refreshPads()

  /**
   * Lights every free slot while an item is in hand. Without it the player has
   * to work out where a drop is legal; with it the board answers the question
   * the moment they pick something up.
   */
  function setSlotHighlight(active) {
    padMaterial.opacity = active ? 0.55 : 0.22
    padMaterial.emissiveIntensity = active ? 0.45 : 0
  }

  /** Only empty slots show their pad — an occupied one would z-fight the item. */
  function refreshPads() {
    for (const slot of slots) {
      slot.pad.visible = !slot.item
    }
  }

  /** Every mesh the raycaster should consider: items to pick, pads to drop on. */
  function pickables() {
    const meshes = []
    for (const item of items) {
      if (!item.cleared) {
        meshes.push(item.mesh)
      }
    }
    for (const slot of slots) {
      if (!slot.item) {
        meshes.push(slot.pad)
      }
    }
    return meshes
  }

  /** The three slots of one shelf, left to right. */
  function shelfSlots(shelfIndex) {
    return slots.filter(slot => slot.shelfIndex === shelfIndex)
  }

  /** The kind filling a shelf completely, or null if it is mixed or has a gap. */
  function completedKind(shelfIndex) {
    const row = shelfSlots(shelfIndex)
    const first = row[0].item
    if (!first) {
      return null
    }
    return row.every(slot => slot.item && slot.item.kindId === first.kindId) ? first.kindId : null
  }

  function reset() {
    let cursor = 0
    for (const slot of slots) {
      slot.item = null
    }

    LAYOUT.forEach((row, shelfIndex) => {
      row.forEach((kindId, slotIndex) => {
        if (!kindId) {
          return
        }
        const item = items[cursor]
        cursor += 1

        const slot = slotAt(shelfIndex, slotIndex)
        item.slot = slot
        item.cleared = false
        item.mesh.visible = true
        item.mesh.scale.setScalar(1)
        item.mesh.position.copy(slot.position)
        slot.item = item
      })
    })

    refreshPads()
  }

  function dispose() {
    for (const item of geometries) {
      item.dispose()
    }
    for (const item of materials) {
      item.dispose()
    }
  }

  return {
    group,
    slots,
    items,
    pickables,
    refreshPads,
    setSlotHighlight,
    shelfSlots,
    completedKind,
    reset,
    dispose,
    rackHeight,
    /** How many distinct kinds the board holds — the win condition. */
    kindCount: KINDS.length,
  }
}
