/**
 * Motion for the home page "clothesline": project cards pegged to a rope that
 * can be dragged sideways, loops forever and lets every card swing on its peg.
 *
 * Split in two on purpose. `createRope` is only the shape the cards ride on;
 * `stepLine` is the physics of the moving line and the swinging cards. Swap the
 * shape (a conveyor belt, a straight wire) and the motion stays the same.
 *
 * Plain module, no Vue: the component owns the DOM and the animation frame,
 * these functions only turn time and input into numbers.
 */

/** A path the cards hang from, in the container's pixel space. */
export interface LinePath {
  /** Height of the rope at `x`. */
  y: (x: number) => number
  /** Slope of the rope at `x`, in degrees (positive = rope goes down to the right). */
  tilt: (x: number) => number
}

export interface RopeOptions {
  /** Container width the rope spans. */
  width: number
  /** Height of the rope at its ends. */
  top: number
  /** How far the middle hangs below the ends. */
  sag: number
  /**
   * Catenary stiffness: 0 is a parabola, higher values give the flat middle and
   * steep ends of a heavier, tighter rope.
   */
  shape?: number
}

/**
 * A catenary, the curve a real rope takes under its own weight. `depth` runs
 * from 1 at the lowest point to 0 at the ends; past the ends (cards that slide
 * off screen) it keeps rising, so they leave upward along the rope.
 */
export const createRope = ({ width, top, sag, shape = 1.6 }: RopeOptions): LinePath => {
  const half = Math.max(1, width / 2)
  const norm = Math.cosh(shape) - 1
  const toUnit = (x: number) => Math.min(1.4, Math.max(-1.4, (x - half) / half))

  const depth = (unit: number) => 1 - (Math.cosh(shape * unit) - 1) / norm
  const lean = (unit: number) => -(shape * Math.sinh(shape * unit)) / norm

  return {
    y: x => top + sag * depth(toUnit(x)),
    tilt: x => Math.atan((sag * lean(toUnit(x))) / half) * (180 / Math.PI),
  }
}

/** SVG path data for a rope, a little wider than the box so its ends never show. */
export const ropePathData = (path: LinePath, width: number, segments = 80): string => {
  let data = ''
  for (let index = 0; index <= segments; index++) {
    const x = -0.06 * width + (1.12 * width * index) / segments
    data += `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${path.y(x).toFixed(1)} `
  }
  return data
}

/** Stable pseudo-random 0…1 per index: each card keeps its own tilt across renders and SSR. */
export const hash01 = (seed: number): number => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}

export interface LineState {
  /** Offset of the whole line in px; grows to the right. */
  position: number
  /** px/s. */
  velocity: number
  /** Velocity low-passed, so a jerk of the hand reads as acceleration, not noise. */
  smoothVelocity: number
  dragging: boolean
  /** Per-card swing angle (deg) and angular velocity (deg/s). */
  swing: Float32Array
  spin: Float32Array
}

export const createLineState = (slots: number): LineState => ({
  position: 0,
  velocity: 0,
  smoothVelocity: 0,
  dragging: false,
  swing: new Float32Array(slots),
  spin: new Float32Array(slots),
})

export interface LineOptions {
  /** px/s the line drifts at when nobody touches it; 0 = still. */
  driftSpeed: number
  /** Multiplier for how hard cards swing; 0 turns the swing off (reduced motion). */
  sway: number
}

/** Pendulum constants, tuned by eye: a card settles in about two swings. */
const SWING_STIFFNESS = 28
const SWING_DAMPING = 1.6
const SWING_LIMIT = 14
/** How fast a released line eases back to the drift speed (1/s). */
const DRIFT_RETURN = 2.2

/**
 * Advances the line by `dt` seconds. Returns false once everything is at rest,
 * so the caller can stop requesting frames until the next input.
 */
export const stepLine = (state: LineState, options: LineOptions, dt: number): boolean => {
  const target = options.driftSpeed
  if (state.dragging) {
    // The pointer sets the position; the stored velocity is only what the throw will carry.
    state.velocity *= Math.exp(-dt * 9)
  }
  else {
    state.velocity += (target - state.velocity) * (1 - Math.exp(-dt * DRIFT_RETURN))
    state.position += state.velocity * dt
  }

  const previous = state.smoothVelocity
  state.smoothVelocity += (state.velocity - state.smoothVelocity) * Math.min(1, dt * 9)
  // The rope pulls the pegs; the card's inertia makes it lag behind: drive by acceleration.
  const drive = options.sway === 0
    ? 0
    : Math.max(-600, Math.min(600, ((state.smoothVelocity - previous) / dt) * 0.05 * options.sway))

  let moving = state.dragging || Math.abs(target) > 0.01 || Math.abs(state.velocity - target) > 0.4
  for (let index = 0; index < state.swing.length; index++) {
    let angle = state.swing[index] ?? 0
    let spin = state.spin[index] ?? 0
    spin += (-SWING_STIFFNESS * angle - SWING_DAMPING * spin + drive) * dt
    angle = Math.max(-SWING_LIMIT, Math.min(SWING_LIMIT, angle + spin * dt))
    if (Math.abs(angle) < 0.01 && Math.abs(spin) < 0.03 && drive === 0) {
      angle = 0
      spin = 0
    }
    else {
      moving = true
    }
    state.swing[index] = angle
    state.spin[index] = spin
  }

  if (!moving) {
    state.velocity = target
    state.smoothVelocity = target
  }
  return moving
}

/**
 * Where slot `index` sits along an endless line: positions wrap around a loop
 * of `slots * step` px centred on the container, so a card leaving one edge
 * re-enters at the other while it is hidden by the edge fade.
 */
export const slotX = (index: number, step: number, slots: number, position: number, width: number): number => {
  const loop = slots * step
  let offset = (index * step + position + loop / 2) % loop
  if (offset < 0) {
    offset += loop
  }
  return width / 2 + offset - loop / 2
}
