import {
  BoxGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  OctahedronGeometry,
  Object3D,
} from 'three'
import { CONFIG } from './config.js'

/** Two empty blocks before the first obstacle, so the player can learn the swipe. */
const FIRST_OBSTACLE_BLOCK = 2

/** Resting height of a gem above the track. */
const GEM_HEIGHT = 0.5

/** How long the collect animation runs before the gem is hidden. */
const GEM_POP_DURATION = 0.3

/** Exported so feedback bursts can spark in the colour of whatever was hit. */
export const COLORS = {
  floorA: 0x2b3560,
  floorB: 0x3a4680,
  rail: 0x1b2340,
  obstacle: 0xff5d73,
  gate: 0xffab54,
  finish: 0x12b488,
  gem: 0x6fd3ff,
}

/**
 * All four are solvable with the only input there is — a left/right swipe — so
 * every one of them always leaves an open lane.
 */
const PATTERN = ['gate', 'slider', 'spinner', 'pillars']

/** The whole track, generated. Nothing is loaded, hence zero asset bytes. */
export function createLevel() {
  const group = new Group()
  const obstacles = []
  const gems = []
  const geometries = []
  const materials = []

  const half = CONFIG.trackWidth / 2
  const blockLength = CONFIG.blockLength
  const totalBlocks = FIRST_OBSTACLE_BLOCK + CONFIG.obstacleBlocks + 1
  const trackLength = totalBlocks * blockLength

  function material(color, extra) {
    const created = new MeshLambertMaterial({ color, flatShading: true, ...extra })
    materials.push(created)
    return created
  }

  // Most boxes repeat a handful of sizes — pillars, spinner arms, finish posts.
  // Caching by dimensions means one geometry on the GPU instead of twenty.
  const geometryCache = new Map()

  function geometry(width, height, depth) {
    const key = `${width}|${height}|${depth}`
    let created = geometryCache.get(key)

    if (!created) {
      created = new BoxGeometry(width, height, depth)
      geometryCache.set(key, created)
      geometries.push(created)
    }

    return created
  }

  const floorA = material(COLORS.floorA)
  const floorB = material(COLORS.floorB)
  const railMaterial = material(COLORS.rail)
  const obstacleMaterial = material(COLORS.obstacle)
  const gateMaterial = material(COLORS.gate)
  const finishMaterial = material(COLORS.finish, { emissive: COLORS.finish, emissiveIntensity: 0.35 })
  const gemMaterial = material(COLORS.gem, { emissive: COLORS.gem, emissiveIntensity: 0.6 })

  /** Adds a box and remembers its half-extents for the collision test. */
  function addBox(parent, width, height, depth, mat) {
    const mesh = new Mesh(geometry(width, height, depth), mat)
    mesh.userData.halfSize = { x: width / 2, y: height / 2, z: depth / 2 }
    parent.add(mesh)
    return mesh
  }

  /* Floor */

  const floorGeometry = geometry(CONFIG.trackWidth, 0.4, blockLength)

  for (let block = 0; block < totalBlocks; block += 1) {
    const isFinish = block === totalBlocks - 1
    // Tiles alternate by material, not by shape.
    const tile = new Mesh(
      floorGeometry,
      isFinish ? finishMaterial : (block % 2 === 0 ? floorA : floorB),
    )
    tile.position.set(0, -0.2, -(block + 0.5) * blockLength)
    group.add(tile)
  }

  /* Side rails — purely visual: the marble is clamped and can never fall off */

  const railGeometry = geometry(0.16, 0.3, trackLength)
  for (const side of [-1, 1]) {
    const rail = new Mesh(railGeometry, railMaterial)
    rail.position.set(side * (half + 0.08), 0.05, -trackLength / 2)
    group.add(rail)
  }

  /* Obstacles */

  function buildGate(z, side) {
    const gapCenter = side * 0.85
    const gapHalf = 0.78

    for (const direction of [-1, 1]) {
      const inner = gapCenter + direction * gapHalf
      const outer = direction * half
      const width = Math.abs(outer - inner)
      if (width < 0.15) {
        continue
      }
      const wall = addBox(group, width, 0.9, 0.45, gateMaterial)
      wall.position.set((inner + outer) / 2, 0.45, z)
      obstacles.push({ mesh: wall })
    }
  }

  function buildSlider(z, speed, phase) {
    const mesh = addBox(group, 1.7, 0.75, 0.5, obstacleMaterial)
    mesh.position.set(0, 0.37, z)
    obstacles.push({
      mesh,
      update: (time) => {
        mesh.position.x = Math.sin(time * speed + phase) * 1.15
      },
    })
  }

  /** One arm, not two: it can never block both sides of the track at once. */
  function buildSpinner(z, speed, phase) {
    const pivot = new Object3D()
    pivot.position.set(0, 0.36, z)
    group.add(pivot)

    const arm = addBox(pivot, 1.3, 0.32, 0.32, obstacleMaterial)
    arm.position.x = 0.65

    const hub = addBox(pivot, 0.34, 0.34, 0.34, gateMaterial)
    hub.position.set(0, 0, 0)

    obstacles.push({
      mesh: arm,
      update: (time) => {
        pivot.rotation.y = time * speed + phase
      },
    })
    obstacles.push({ mesh: hub })
  }

  function buildPillars(z, offset) {
    for (const x of [offset, offset + 1.55]) {
      const pillar = addBox(group, 0.7, 1, 0.7, obstacleMaterial)
      pillar.position.set(x, 0.5, z)
      obstacles.push({ mesh: pillar })
    }
  }

  for (let index = 0; index < CONFIG.obstacleBlocks; index += 1) {
    const block = FIRST_OBSTACLE_BLOCK + index
    const z = -(block + 0.5) * blockLength
    // Later obstacles move faster; the alternating sign keeps the swipes varied.
    const speed = 1.5 + index * 0.16
    const side = index % 2 === 0 ? 1 : -1

    switch (PATTERN[index % PATTERN.length]) {
      case 'gate':
        buildGate(z, side)
        break
      case 'slider':
        buildSlider(z, speed, index * 1.3)
        break
      case 'spinner':
        buildSpinner(z, speed * side, index * 0.7)
        break
      default:
        buildPillars(z, index % 4 === 3 ? -1.5 : -0.1)
        break
    }
  }

  /* Finish gate — decorative on purpose: losing a life on the finish line is cruel */

  for (const side of [-1, 1]) {
    const post = addBox(group, 0.3, 1.6, 0.3, finishMaterial)
    post.position.set(side * (half - 0.2), 0.8, -(totalBlocks - 1) * blockLength)
  }

  /* Gems — placed on block seams, away from the obstacles at block centres */

  const gemGeometry = new OctahedronGeometry(0.19)
  geometries.push(gemGeometry)

  for (let block = 1; block < totalBlocks - 1; block += 1) {
    for (let slot = 0; slot < CONFIG.gemsPerBlock; slot += 1) {
      const offset = slot === 0 ? 0.7 : blockLength - 0.7
      const z = -(block * blockLength + offset)
      const mesh = new Mesh(gemGeometry, gemMaterial)
      mesh.position.set(Math.sin(block * 1.7 + slot * 2.4) * 1.1, GEM_HEIGHT, z)
      group.add(mesh)
      // `pop` drives the collect animation; the gem stays in the scene until it
      // finishes, which is why picking one up is not the same as hiding it.
      gems.push({ mesh, collected: false, pop: 0 })
    }
  }

  function update(time, delta) {
    for (const obstacle of obstacles) {
      obstacle.update?.(time)
    }

    for (const gem of gems) {
      if (!gem.collected) {
        gem.mesh.rotation.y = time * 2
        gem.mesh.position.y = GEM_HEIGHT + Math.sin(time * 3 + gem.mesh.position.z) * 0.06
        continue
      }

      if (gem.pop >= 1) {
        continue
      }

      // Pops outward, then shrinks away while rising — the pickup reads as a
      // reward instead of the gem simply vanishing.
      gem.pop = Math.min(1, gem.pop + delta / GEM_POP_DURATION)
      const scale = gem.pop < 0.35
        ? 1 + (gem.pop / 0.35) * 0.9
        : 1.9 * (1 - (gem.pop - 0.35) / 0.65)

      gem.mesh.scale.setScalar(Math.max(0, scale))
      gem.mesh.position.y = GEM_HEIGHT + gem.pop * 0.9
      gem.mesh.rotation.y = time * 6

      if (gem.pop >= 1) {
        gem.mesh.visible = false
      }
    }
    // Collision reads matrixWorld, so refresh it before the game does its checks.
    group.updateMatrixWorld(true)
  }

  /** Clears everything a run leaves behind: collected gems and obstacle hits. */
  function resetRun() {
    for (const gem of gems) {
      gem.collected = false
      gem.pop = 0
      gem.mesh.visible = true
      gem.mesh.scale.setScalar(1)
      gem.mesh.position.y = GEM_HEIGHT
    }
    for (const obstacle of obstacles) {
      obstacle.hits = 0
    }
  }

  resetRun()

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
    obstacles,
    gems,
    update,
    resetRun,
    dispose,
    totalGems: gems.length,
    startZ: -1.5,
    finishZ: -((totalBlocks - 1) * blockLength + blockLength / 2),
  }
}
