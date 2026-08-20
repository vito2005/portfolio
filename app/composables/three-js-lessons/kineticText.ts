import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js'

/**
 * Kinetic text — a headline that lies flat until the pointer walks through it,
 * then tumbles out in 3D, shoves its neighbours aside and springs back onto the
 * baseline.
 *
 * The "flat at rest" half is not a second set of meshes. Every glyph is a real
 * extruded solid; what hides the extrusion at rest is colour, not geometry. A
 * letter's sides fade to the page background as it settles, so a sleeping glyph
 * is indistinguishable from flat type while a moving one shows solid colour.
 * Fading to the background rather than to transparency keeps every material
 * opaque — no transparent/opaque sorting to fight inside a two-group mesh.
 *
 * Motion is a damped spring towards the rest transform rather than a rigid-body
 * world: it reproduces the reference (fly out, overshoot, settle) in a fraction
 * of the code, and — unlike real physics — a letter can never come to rest
 * anywhere but its own slot. Letter-on-letter contact is handled separately, as
 * circle collisions; see `resolveLetterCollisions`.
 */

/** Faces the camera at rest, so the resting headline reads as plain black text. */
const FRONT_COLOR = '#111111'

/** Only ever fully saturated while a letter is moving — this is the payoff. */
export const SIDE_PALETTE = ['#D64541', '#3B5BDB', '#E9B8B4', '#8FA99B', '#C08B5C', '#9BB4D9']

/** Coprime with the palette length, so neighbours never share a colour. */
const PALETTE_STRIDE = 5

export interface KineticTextOptions {
    size: number
    depth: number
    /** Multiple of `size`. */
    lineHeight: number
    /** Extra tracking in world units, added to each glyph's advance width. */
    letterSpacing: number
    /** Peak shadow opacity, reached at full travel. A resting letter casts none. */
    shadowStrength: number
    /** What a resting letter's sides fade into — must match the scene clear colour. */
    backgroundColor: string
}

export interface KineticMotionParameters {
    /** Sideways kick away from the pointer. */
    impulse: number
    /** Upward kick, added on top of `impulse`. */
    lift: number
    /** Peak tumble rate in radians/second. */
    spin: number
    /** Spring constant pulling a letter back to its slot. */
    stiffness: number
    /** Velocity damping — too low and letters oscillate forever. */
    damping: number
    /** How hard the glyph is rotated flat again as it nears home. */
    flatten: number
    /** Restitution for letter-on-letter contact: 0 dead stop, 1 fully elastic. */
    bounce: number
}

export interface KineticLetter {
    mesh: THREE.Mesh
    /** Per letter, not shared: its colour is animated independently. */
    sideMaterial: THREE.MeshBasicMaterial
    /** Page background — what the sides fade into at rest. */
    restColor: THREE.Color
    /** This letter's palette colour, worn at full travel. */
    sideColor: THREE.Color
    /**
     * Invisible proxy the pointer ray hits. It tracks the letter's position but
     * never its rotation: a tumbling glyph turns edge-on twice per revolution,
     * and a hitbox that followed the spin would become impossible to hit there.
     */
    hitbox: THREE.Mesh
    shadow: THREE.Mesh
    restPosition: THREE.Vector3
    velocity: THREE.Vector3
    angularVelocity: THREE.Vector3
    /** Collision radius — deliberately smaller than the glyph, see below. */
    radius: number
    /** Base shadow footprint, spread out as the letter rises off the baseline. */
    shadowScale: THREE.Vector2
    /** Peak opacity; the flight code scales this by travel and by height. */
    shadowStrength: number
    /** Only a moving letter is integrated; idle ones cost nothing per frame. */
    isFlying: boolean
}

export interface KineticText {
    group: THREE.Group
    letters: KineticLetter[]
    hitboxes: THREE.Mesh[]
    bounds: THREE.Box3
    setShadowsVisible: (visible: boolean) => void
    setShadowStrength: (strength: number) => void
    dispose: () => void
}

const REST_QUATERNION = new THREE.Quaternion()

/** Soft round blob used as a fake contact shadow — far cheaper than a shadow map. */
const createShadowTexture = (): THREE.Texture => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128

    const context = canvas.getContext('2d')
    if (!context) {
        throw new Error('kineticText: could not get a 2D context for the shadow texture')
    }

    // Weighted towards the centre and fairly dark: the blob is squashed to a
    // sliver on screen, so a gentle gradient washes out to nothing against a
    // near-white page.
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)')
    gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.55)')
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.14)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, 128, 128)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace

    return texture
}

interface GlyphEntry {
    geometry: TextGeometry
    /** Size of the extruded glyph, used for the hitbox and the shadow footprint. */
    extent: THREE.Vector3
    x: number
    y: number
    /** Which line this glyph belongs to — each line gets its own shadow floor. */
    lineIndex: number
}

/**
 * Builds one mesh per glyph, laid out with the font's own advance widths.
 *
 * `TextGeometry` on the whole string would be a single mesh — useless here,
 * since each letter has to move on its own. Laying the glyphs out by hand is
 * the price of that, and it also lets every letter rotate about its own centre
 * rather than about the baseline origin the font gives it.
 */
export const createKineticText = (
    lines: string[],
    font: Font,
    options: KineticTextOptions,
): KineticText => {
    const { size, depth, lineHeight, letterSpacing, backgroundColor, shadowStrength } = options
    const { resolution } = font.data

    const entries: GlyphEntry[] = []
    // Lowest point of each line on its own. A single floor under the whole
    // block would drop the top line's shadows onto the bottom line.
    const lineFloors: number[] = []
    let blockMinX = Infinity
    let blockMaxX = -Infinity
    let blockMinY = Infinity
    let blockMaxY = -Infinity

    for (const [lineIndex, line] of lines.entries()) {
        const advances = [...line].map((character) => {
            const glyph = font.data.glyphs[character]
            // An unmapped character would otherwise pile up at x = 0.
            const advance = glyph ? (glyph.ha / resolution) * size : size * 0.5
            return advance + letterSpacing
        })

        // Trailing tracking is not part of the line, so don't centre against it.
        const lineWidth = advances.reduce((total, advance) => total + advance, 0) - letterSpacing
        const lineY = -lineIndex * lineHeight * size

        let cursorX = -lineWidth / 2

        for (const [characterIndex, character] of [...line].entries()) {
            if (character.trim() === '') {
                cursorX += advances[characterIndex]!
                continue
            }

            const geometry = new TextGeometry(character, {
                font,
                size,
                depth,
                curveSegments: 8,
                // No bevel: a chamfer reads as a coloured rim around the glyph
                // even face-on, which breaks the "flat text at rest" trick the
                // whole effect rests on. A clean prism stays invisible.
                bevelEnabled: false,
            })

            geometry.computeBoundingBox()
            const boundingBox = geometry.boundingBox
            if (!boundingBox) {
                geometry.dispose()
                cursorX += advances[characterIndex]!
                continue
            }

            const center = boundingBox.getCenter(new THREE.Vector3())
            const extent = boundingBox.getSize(new THREE.Vector3())

            // Re-origin the glyph on its own centre so it tumbles about itself.
            geometry.center()

            const x = cursorX + center.x
            const y = lineY + center.y

            blockMinX = Math.min(blockMinX, x - extent.x / 2)
            blockMaxX = Math.max(blockMaxX, x + extent.x / 2)
            blockMinY = Math.min(blockMinY, y - extent.y / 2)
            blockMaxY = Math.max(blockMaxY, y + extent.y / 2)
            lineFloors[lineIndex] = Math.min(lineFloors[lineIndex] ?? Infinity, y - extent.y / 2)

            entries.push({ geometry, extent, x, y, lineIndex })
            cursorX += advances[characterIndex]!
        }
    }

    // Centre the whole block on the origin so the camera can just look at 0,0,0.
    const offsetY = entries.length > 0 ? -(blockMinY + blockMaxY) / 2 : 0
    const shadowGap = size * 0.09
    const floors = lineFloors.map(lineMinY => lineMinY + offsetY - shadowGap)
    const lowestFloor = entries.length > 0 ? Math.min(...floors) : 0

    const group = new THREE.Group()
    const letters: KineticLetter[] = []
    const hitboxes: THREE.Mesh[] = []

    const background = new THREE.Color(backgroundColor)
    const frontMaterial = new THREE.MeshBasicMaterial({ color: FRONT_COLOR })
    const shadowTexture = createShadowTexture()
    const perLetterMaterials: THREE.Material[] = []

    // Shared across every letter — only the per-instance transform differs.
    const hitboxGeometry = new THREE.BoxGeometry(1, 1, 1)
    const shadowGeometry = new THREE.PlaneGeometry(1, 1)
    // Shadows sit behind the glyphs rather than on a ground plane. A real floor
    // is seen almost edge-on by this near-orthographic camera and collapses to
    // a hairline; a squashed ellipse facing the camera reads at any angle.
    const shadowZ = -depth * 2

    for (const [index, entry] of entries.entries()) {
        const paletteColor = SIDE_PALETTE[(index * PALETTE_STRIDE) % SIDE_PALETTE.length]!

        // Starts at the background colour: every letter is born asleep.
        const sideMaterial = new THREE.MeshBasicMaterial({ color: background })
        perLetterMaterials.push(sideMaterial)

        // ExtrudeGeometry emits two groups: 0 = the flat caps, 1 = the sides.
        const mesh = new THREE.Mesh(entry.geometry, [frontMaterial, sideMaterial])
        const restPosition = new THREE.Vector3(entry.x, entry.y + offsetY, 0)
        mesh.position.copy(restPosition)

        // Raycaster ignores `visible`, so this tracks the glyph without drawing.
        const hitbox = new THREE.Mesh(hitboxGeometry, frontMaterial)
        hitbox.visible = false
        hitbox.position.copy(restPosition)
        hitbox.scale.set(entry.extent.x * 1.08, entry.extent.y * 1.08, Math.max(entry.extent.z, size))
        hitbox.userData.letterIndex = index

        // Half the glyph's *narrow* dimension. Letters sit close enough on the
        // baseline that a radius drawn from the wide dimension would have them
        // permanently colliding at rest and jittering the headline apart.
        const radius = Math.min(entry.extent.x, entry.extent.y) * 0.5

        const shadowScale = new THREE.Vector2(entry.extent.x * 0.95, size * 0.26)
        const shadowMaterial = new THREE.MeshBasicMaterial({
            map: shadowTexture,
            transparent: true,
            depthWrite: false,
            // Born asleep, and a sleeping letter casts no shadow — at rest the
            // headline is nothing but flat type on the page.
            opacity: 0,
        })
        perLetterMaterials.push(shadowMaterial)

        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
        shadow.position.set(restPosition.x, floors[entry.lineIndex]!, shadowZ)
        shadow.scale.set(shadowScale.x, shadowScale.y, 1)
        // Draw before the glyphs so a settled letter never z-fights its shadow.
        shadow.renderOrder = -1

        group.add(mesh, hitbox, shadow)
        hitboxes.push(hitbox)
        letters.push({
            mesh,
            sideMaterial,
            restColor: background,
            sideColor: new THREE.Color(paletteColor),
            hitbox,
            shadow,
            restPosition,
            velocity: new THREE.Vector3(),
            angularVelocity: new THREE.Vector3(),
            radius,
            shadowScale,
            shadowStrength,
            isFlying: false,
        })
    }

    const bounds = new THREE.Box3(
        new THREE.Vector3(blockMinX, lowestFloor, shadowZ),
        new THREE.Vector3(blockMaxX, blockMaxY + offsetY, depth),
    )

    return {
        group,
        letters,
        hitboxes,
        bounds,
        setShadowsVisible: (visible: boolean) => {
            for (const letter of letters) {
                letter.shadow.visible = visible
            }
        },
        setShadowStrength: (strength: number) => {
            // Only the ceiling changes; resting letters stay at zero and flying
            // ones pick the new value up on the next frame.
            for (const letter of letters) {
                letter.shadowStrength = strength
            }
        },
        dispose: () => {
            group.removeFromParent()

            for (const entry of entries) {
                entry.geometry.dispose()
            }
            for (const material of perLetterMaterials) {
                material.dispose()
            }

            hitboxGeometry.dispose()
            shadowGeometry.dispose()
            frontMaterial.dispose()
            shadowTexture.dispose()
        },
    }
}

/**
 * Kicks a letter out of its slot, away from wherever the pointer touched it.
 *
 * The forced +Z component matters: a letter shoved straight sideways stays
 * edge-on and the coloured extrusion never becomes visible.
 *
 * Safe to call on a letter that is already in flight — the caller decides when
 * that happens, and the speed clamp keeps repeat hits from compounding into a
 * letter that shoots off screen.
 */
export const knockLetter = (
    letter: KineticLetter,
    contactPoint: THREE.Vector3,
    parameters: KineticMotionParameters,
): void => {
    const direction = new THREE.Vector3().subVectors(letter.mesh.position, contactPoint)
    direction.z = 0

    // A hit dead-centre gives no direction at all — pick one.
    if (direction.lengthSq() < 1e-6) {
        direction.set(Math.random() - 0.5, Math.random() - 0.5, 0)
    }
    direction.normalize()
    direction.z = 0.45

    letter.velocity.addScaledVector(direction, parameters.impulse)
    letter.velocity.y += parameters.lift
    letter.angularVelocity.set(
        (Math.random() - 0.5) * 2 * parameters.spin,
        (Math.random() - 0.5) * 2 * parameters.spin,
        (Math.random() - 0.5) * 2 * parameters.spin,
    )
    letter.isFlying = true
}

const spinDelta = new THREE.Quaternion()
const spinEuler = new THREE.Euler()
const toRest = new THREE.Vector3()
const contactNormal = new THREE.Vector3()
const relativeVelocity = new THREE.Vector3()

/**
 * Letter-on-letter contact, as equal-mass circles in the XY plane.
 *
 * Full rigid-body physics on glyph outlines would be the "correct" answer and
 * is what a physics engine buys you, but it is the wrong trade here: the shapes
 * are concave (every counter and crossbar), so they would need convex
 * decomposition, and the letters must still be spring-driven back to a fixed
 * slot afterwards — which is not something a solver will do for you. Circles
 * reproduce the thing you actually see: letters shove each other aside instead
 * of sliding through.
 *
 * A resting letter that gets hit wakes up, which is what makes a single knock
 * cascade down the line.
 */
const resolveLetterCollisions = (
    letters: KineticLetter[],
    parameters: KineticMotionParameters,
): void => {
    for (let i = 0; i < letters.length; i += 1) {
        const a = letters[i]!

        for (let j = i + 1; j < letters.length; j += 1) {
            const b = letters[j]!

            // Two sleeping letters are already resolved by construction.
            if (!a.isFlying && !b.isFlying) {
                continue
            }

            contactNormal.subVectors(b.mesh.position, a.mesh.position)
            // Contact is judged in the plane of the headline: letters pass in
            // front of each other along Z all the time and should not collide
            // for it, otherwise flying letters bounce off thin air.
            contactNormal.z = 0

            const minimumDistance = a.radius + b.radius
            const distanceSq = contactNormal.lengthSq()
            if (distanceSq >= minimumDistance * minimumDistance || distanceSq < 1e-8) {
                continue
            }

            const distance = Math.sqrt(distanceSq)
            contactNormal.divideScalar(distance)

            // Push both out of overlap. Equal split keeps the pair's centre of
            // mass put, so a collision can never drag the headline sideways.
            const correction = (minimumDistance - distance) / 2
            a.mesh.position.addScaledVector(contactNormal, -correction)
            b.mesh.position.addScaledVector(contactNormal, correction)

            relativeVelocity.subVectors(b.velocity, a.velocity)
            const approachSpeed = relativeVelocity.dot(contactNormal)
            // Already separating — resolving again would suck them together.
            if (approachSpeed < 0) {
                const exchange = -(1 + parameters.bounce) * approachSpeed / 2
                a.velocity.addScaledVector(contactNormal, -exchange)
                b.velocity.addScaledVector(contactNormal, exchange)
            }

            // Being shoved is enough to wake a letter and start it tumbling.
            for (const letter of [a, b]) {
                if (!letter.isFlying) {
                    letter.isFlying = true
                    letter.angularVelocity.set(
                        (Math.random() - 0.5) * parameters.spin,
                        (Math.random() - 0.5) * parameters.spin,
                        (Math.random() - 0.5) * parameters.spin,
                    )
                }
            }
        }
    }
}

/** Integrates every letter currently in motion and parks the ones that settled. */
export const updateKineticLetters = (
    letters: KineticLetter[],
    delta: number,
    parameters: KineticMotionParameters,
    settleRadius: number,
): void => {
    const velocityDecay = Math.exp(-parameters.damping * delta)
    // Tumble bleeds off at the same rate as travel: decaying it faster costs
    // the full rotation that makes the letter read as a solid rather than a
    // card, and `flatten` below is what actually lands it face-on anyway.
    const spinDecay = Math.exp(-parameters.damping * delta)

    for (const letter of letters) {
        if (!letter.isFlying) {
            continue
        }

        toRest.subVectors(letter.restPosition, letter.mesh.position)
        letter.velocity.addScaledVector(toRest, parameters.stiffness * delta)
        letter.velocity.multiplyScalar(velocityDecay)
        letter.mesh.position.addScaledVector(letter.velocity, delta)

        letter.angularVelocity.multiplyScalar(spinDecay)
        spinEuler.set(
            letter.angularVelocity.x * delta,
            letter.angularVelocity.y * delta,
            letter.angularVelocity.z * delta,
        )
        spinDelta.setFromEuler(spinEuler)
        letter.mesh.quaternion.premultiply(spinDelta)

        // Flattening ramps up as the letter comes home, so it lands face-on
        // instead of freezing at whatever angle the spin left it.
        const distance = toRest.length()
        const settle = 1 - Math.min(distance / settleRadius, 1)
        letter.mesh.quaternion.slerp(REST_QUATERNION, Math.min(settle * parameters.flatten * delta, 1))
    }

    // After integration, before presentation: positions are final for this frame.
    resolveLetterCollisions(letters, parameters)

    // Contact resolution injects energy — both the positional push-apart and the
    // restitution impulse — so a busy pointer can pump letters clean off screen
    // over a few frames. One ceiling on the whole system keeps travel bounded
    // no matter how the speed was acquired.
    const maximumSpeed = parameters.impulse * 1.3

    for (const letter of letters) {
        if (!letter.isFlying) {
            continue
        }

        letter.velocity.clampLength(0, maximumSpeed)

        // The hitbox rides along, so a letter can be hit again mid-flight.
        letter.hitbox.position.copy(letter.mesh.position)

        const distance = letter.mesh.position.distanceTo(letter.restPosition)

        // Colour tracks motion, and takes the max of two cues on purpose:
        // speed alone would blink out at the top of the arc where the letter is
        // momentarily still, and travel alone would lag behind the initial hit.
        const speedCue = letter.velocity.length() / (parameters.impulse * 0.35)
        const travelCue = distance / (settleRadius * 0.5)
        const ink = Math.min(Math.max(speedCue, travelCue), 1)
        letter.sideMaterial.color.lerpColors(letter.restColor, letter.sideColor, ink)

        // Only x tracks the glyph: y is the line's floor and z keeps the shadow
        // behind the text, so a letter flying at the camera doesn't drag it out.
        letter.shadow.position.x = letter.mesh.position.x

        const height = letter.mesh.position.y - letter.shadow.position.y
        const spread = 1 + Math.max(height, 0) * 0.22
        letter.shadow.scale.set(letter.shadowScale.x * spread, letter.shadowScale.y * spread, 1)
        const shadowMaterial = letter.shadow.material as THREE.MeshBasicMaterial
        // Same `ink` cue as the sides: the shadow arrives with the movement and
        // is gone by the time the letter is home. Divided by spread² on top, so
        // a letter lifted off the baseline throws a wider, fainter blob.
        shadowMaterial.opacity = (letter.shadowStrength * ink) / spread ** 2

        // Loose thresholds on purpose: 0.004 world units is well under a pixel
        // at this camera distance, and a tighter test leaves letters awake for
        // seconds, jittering imperceptibly.
        const isStill = distance < 0.004
            && letter.velocity.lengthSq() < 1e-4
            && letter.mesh.quaternion.angleTo(REST_QUATERNION) < 0.01

        if (isStill) {
            letter.mesh.position.copy(letter.restPosition)
            letter.hitbox.position.copy(letter.restPosition)
            letter.mesh.quaternion.identity()
            letter.velocity.set(0, 0, 0)
            letter.angularVelocity.set(0, 0, 0)
            letter.shadow.position.x = letter.restPosition.x
            letter.shadow.scale.set(letter.shadowScale.x, letter.shadowScale.y, 1)
            shadowMaterial.opacity = 0
            // Land exactly on the background, not a hair short of it.
            letter.sideMaterial.color.copy(letter.restColor)
            letter.isFlying = false
        }
    }
}
