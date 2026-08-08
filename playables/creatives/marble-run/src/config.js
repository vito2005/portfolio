/** Every tuning number the game has, in one place — the art lead will want to move these. */
export const CONFIG = {
  /** Where the CTA sends the player. Swap per campaign. */
  storeUrl: 'https://play.google.com/store/apps/details?id=com.skywaylab.marblerush',

  /** Track is 4 units wide; the marble is clamped inside so it can never fall off. */
  trackWidth: 4,
  blockLength: 4,
  obstacleBlocks: 10,
  steerRange: 1.5,

  marbleRadius: 0.32,
  /** Speed ramps up so the run feels faster than it is — 16 s of clean play. */
  speedStart: 3.2,
  speedMax: 5,
  speedRamp: 0.11,
  /** Higher = the marble snaps to the finger faster. */
  steerLerp: 9,

  lives: 3,
  /** Gap between bounces, so one contact can't fire on every frame of an overlap. */
  hitGrace: 0.8,
  /** How far back a hit throws the marble. */
  hitKnockback: 1.1,

  gemsPerBlock: 2,
  gemPickupRadius: 0.62,

  /** Auto-open the endcard if the player just puts the phone down. */
  idleTimeout: 45,

  /**
   * Feedback presets. Every juicy event picks a tier instead of inventing its
   * own numbers, which is what keeps the whole creative proportional — see the
   * "Game feel" section of AGENTS.md.
   */
  juice: {
    small: { trauma: 0.15, freeze: 0, particles: 4 },
    medium: { trauma: 0.4, freeze: 0.05, particles: 10 },
    large: { trauma: 0.8, freeze: 0.12, particles: 28 },

    /** Trauma lost per second; the shake always ends on its own. */
    traumaDecay: 1.3,
    /** Peak camera offset in world units, reached at trauma = 1. */
    maxShake: 0.3,
    /** Peak camera roll in radians. */
    maxRoll: 0.055,
    /** Extra degrees of field of view at top speed — sells the acceleration. */
    fovKick: 5,
    /** How long the marble takes to spring back after a squash. */
    squashDuration: 0.2,
  },

  /** Let a big finish read before the endcard covers the screen. */
  endcardDelay: 0.5,
}
