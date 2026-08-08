/** Every tuning number the creative has, in one place. */
export const CONFIG = {
  /** Where the CTA sends the player. Swap per campaign. */
  storeUrl: 'https://play.google.com/store/apps/details?id=com.skywaylab.shelfsort',

  shelfCount: 5,
  slotsPerShelf: 3,
  /** Spacing of the rack, in world units. */
  slotWidth: 1.15,
  shelfGap: 1.25,

  /**
   * Twelve items and three free slots means the board is solvable in exactly
   * twelve moves. Fourteen leaves room for two mistakes without making it dull.
   */
  moves: 14,

  /** How long an item takes to fly to its new slot, and how high it arcs. */
  moveDuration: 0.26,
  moveArc: 0.55,
  /** Pause before a completed shelf pops, so the player sees why it cleared. */
  clearDelay: 0.18,

  endcardDelay: 0.6,
  idleTimeout: 60,

  juice: {
    small: { trauma: 0.1, freeze: 0, particles: 5 },
    medium: { trauma: 0.32, freeze: 0.04, particles: 14 },
    large: { trauma: 0.7, freeze: 0.1, particles: 28 },
    traumaDecay: 1.4,
    maxShake: 0.18,
    maxRoll: 0.03,
  },
}
