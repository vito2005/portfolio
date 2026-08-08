import { Matrix4, Vector3 } from 'three'

const inverse = new Matrix4()
const local = new Vector3()
const closest = new Vector3()

/**
 * Sphere against an oriented box — the whole physics engine.
 *
 * Working off `matrixWorld` means a spinning arm needs no special case: its
 * rotation is already baked into the matrix.
 */
export function sphereHitsBox(mesh, center, radius) {
  const halfSize = mesh.userData.halfSize
  if (!halfSize) {
    return false
  }

  inverse.copy(mesh.matrixWorld).invert()
  local.copy(center).applyMatrix4(inverse)

  closest.set(
    Math.max(-halfSize.x, Math.min(halfSize.x, local.x)),
    Math.max(-halfSize.y, Math.min(halfSize.y, local.y)),
    Math.max(-halfSize.z, Math.min(halfSize.z, local.z)),
  )

  return local.distanceToSquared(closest) < radius * radius
}
