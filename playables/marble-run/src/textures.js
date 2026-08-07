import { CanvasTexture } from 'three'

/**
 * Draws into an offscreen canvas and hands the result back as a texture.
 *
 * Every texture in the creative is generated this way instead of loaded, which
 * is why the build carries no image bytes at all.
 */
export function createCanvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d'), canvas)
  return new CanvasTexture(canvas)
}

/**
 * Soft round sprite from a list of `[offset, color]` gradient stops — the shape
 * behind both the marble's blob shadow and the spark particles.
 */
export function createRadialTexture(size, stops) {
  return createCanvasTexture(size, size, (context) => {
    const half = size / 2
    const gradient = context.createRadialGradient(half, half, 0, half, half, half)
    for (const [offset, color] of stops) {
      gradient.addColorStop(offset, color)
    }
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)
  })
}
