import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js'

/**
 * Kinetic text — a headline whose letters scatter when the pointer walks
 * through them, shove their neighbours aside, and spring back into the line.
 *
 * Motion is a damped spring towards the rest transform rather than a rigid-body
 * world: it reproduces the reference (fly out, overshoot, settle) in a fraction
 * of the code, and — unlike real physics — a letter can never come to rest
 * anywhere but its own slot. Letter-on-letter contact is separate, as circle
 * collisions; see `resolveLetterCollisions`.
 *
 * Two looks share that machinery, chosen with `appearance`:
 *
 * - `flat` — black face, palette-coloured sides that fade into the page as the
 *   letter settles. The extrusion is real the whole time; what hides it at rest
 *   is colour, not geometry, so a sleeping glyph is indistinguishable from
 *   plain type. Fading to the background rather than to transparency keeps
 *   every material opaque — no sorting to fight inside a two-group mesh.
 * - `uniform` — one caller-supplied material (a matcap, say) on every face, so
 *   the solid reads as a solid at all times, moving or not.
 */

/** Faces the camera at rest, so a resting `flat` headline reads as black type. */
const FRONT_COLOR = '#111111'

/** Only ever fully saturated while a letter is moving — this is the payoff. */
export const SIDE_PALETTE = ['#D64541', '#3B5BDB', '#E9B8B4', '#8FA99B', '#C08B5C', '#9BB4D9']

/** Coprime with the palette length, so neighbours never share a colour. */
const PALETTE_STRIDE = 5

export type KineticAppearance =
    /** Sides carry palette colour in motion and sink into the page at rest. */
    | { kind: 'flat', backgroundColor: string }
    /**
     * One material on every face, never recoloured. The material belongs to the
     * caller and is deliberately *not* disposed with the text — it is usually
     * shared with the rest of the scene.
     */
    | { kind: 'uniform', material: THREE.Material }

export interface KineticTextOptions extends GlyphLayoutOptions {
    appearance: KineticAppearance
    /**
     * Fake contact shadows, or `false` for none at all. They only make sense
     * for a headline that sits on a baseline in the plane of the page.
     */
    shadow: { strength: number } | false
}

export interface KineticMotionParameters {
    /** Sideways kick away from the pointer. */
    impulse: number
    /** Upward kick, added on top of `impulse`. */
    lift: number
    /**
     * Stands in for inverse inertia: scales the `r × J` angular impulse into
     * radians/second. Not a peak rate — a centred hit still barely spins.
     */
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
    /** Only the `flat` look animates a side material; `uniform` leaves it null. */
    sideMaterial: THREE.MeshBasicMaterial | null
    /** Page background — what the sides fade into at rest. */
    restColor: THREE.Color | null
    /** This letter's palette colour, worn at full travel. */
    sideColor: THREE.Color | null
    /**
     * Invisible proxy the pointer ray hits. It tracks the letter's position but
     * never its rotation: a tumbling glyph turns edge-on twice per revolution,
     * and a hitbox that followed the spin would become impossible to hit there.
     */
    hitbox: THREE.Mesh
    shadow: THREE.Mesh | null
    restPosition: THREE.Vector3
    velocity: THREE.Vector3
    angularVelocity: THREE.Vector3
    /** Collision radius — deliberately smaller than the glyph, see below. */
    radius: number
    /** Base shadow footprint, spread out as the letter rises off the baseline. */
    shadowScale: THREE.Vector2
    /** Peak shadow opacity; the flight code scales it by travel and by height. */
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

export interface GlyphLayoutOptions {
    size: number
    depth: number
    /** Multiple of `size`. */
    lineHeight: number
    /** Extra tracking in world units, added to each glyph's advance width. */
    letterSpacing: number
    /**
     * Rounded edges catch the light and are worth it under a matcap or a lit
     * material. A flat-shaded look must skip them: a chamfer reads as a rim
     * around the glyph even face-on.
     */
    bevel: boolean
}

export interface LaidOutGlyph {
    geometry: TextGeometry
    /** Size of the extruded glyph — hitboxes, collision shapes, shadow blobs. */
    extent: THREE.Vector3
    /** Where the glyph sits, already centred on the block's origin. */
    position: THREE.Vector3
    lineIndex: number
}

export interface GlyphLayout {
    glyphs: LaidOutGlyph[]
    /** Lowest point of each line, in the same centred space. */
    lineFloors: number[]
    /** Box around the glyphs only; callers extend it for their own extras. */
    bounds: THREE.Box3
}

/**
 * Turns lines of text into one centred, independently positioned geometry per
 * glyph, laid out with the font's own advance widths.
 *
 * `TextGeometry` on the whole string would be a single mesh — useless whenever
 * letters have to move on their own. Laying the glyphs out by hand is the price
 * of that, and it also lets every letter rotate about its own centre rather
 * than about the baseline origin the font gives it.
 *
 * Shared by every lesson that scatters type, whatever drives the motion
 * afterwards — a spring, or a rigid-body world.
 */
export const layoutGlyphs = (
    lines: string[],
    font: Font,
    options: GlyphLayoutOptions,
): GlyphLayout => {
    const { size, depth, lineHeight, letterSpacing, bevel } = options
    const { resolution } = font.data

    const glyphs: LaidOutGlyph[] = []
    // Lowest point of each line on its own. A single floor under the whole
    // block would drop the top line's decoration onto the bottom line.
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
                bevelEnabled: bevel,
                bevelThickness: depth * 0.12,
                bevelSize: depth * 0.08,
                bevelOffset: 0,
                bevelSegments: 3,
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

            glyphs.push({ geometry, extent, position: new THREE.Vector3(x, y, 0), lineIndex })
            cursorX += advances[characterIndex]!
        }
    }

    // Centre the whole block on the origin so a camera can just look at 0,0,0.
    const offsetY = glyphs.length > 0 ? -(blockMinY + blockMaxY) / 2 : 0
    for (const glyph of glyphs) {
        glyph.position.y += offsetY
    }

    return {
        glyphs,
        lineFloors: lineFloors.map(floor => floor + offsetY),
        bounds: new THREE.Box3(
            new THREE.Vector3(blockMinX, blockMinY + offsetY, -depth / 2),
            new THREE.Vector3(blockMaxX, blockMaxY + offsetY, depth / 2),
        ),
    }
}

/**
 * Builds the spring-driven kinetic headline: one mesh per glyph, a hitbox for
 * the pointer, and — for the flat look — a contact shadow.
 */
export const createKineticText = (
    lines: string[],
    font: Font,
    options: KineticTextOptions,
): KineticText => {
    const { size, depth, appearance, shadow } = options

    const layout = layoutGlyphs(lines, font, options)
    const entries = layout.glyphs
    const shadowGap = size * 0.09
    const floors = layout.lineFloors.map(floor => floor - shadowGap)
    const lowestFloor = entries.length > 0 ? Math.min(...floors) : 0

    const group = new THREE.Group()
    const letters: KineticLetter[] = []
    const hitboxes: THREE.Mesh[] = []

    const isFlat = appearance.kind === 'flat'
    const background = isFlat ? new THREE.Color(appearance.backgroundColor) : null
    // Only the flat look owns materials; `uniform` borrows the caller's.
    const frontMaterial = isFlat ? new THREE.MeshBasicMaterial({ color: FRONT_COLOR }) : null
    const ownedMaterials: THREE.Material[] = frontMaterial ? [frontMaterial] : []
    const shadowTexture = shadow ? createShadowTexture() : null

    // Shared across every letter — only the per-instance transform differs.
    const hitboxGeometry = new THREE.BoxGeometry(1, 1, 1)
    const shadowGeometry = shadow ? new THREE.PlaneGeometry(1, 1) : null
    // Shadows sit behind the glyphs rather than on a ground plane. A real floor
    // is seen almost edge-on by a near-orthographic camera and collapses to a
    // hairline; a squashed ellipse facing the camera reads at any angle.
    const shadowZ = -depth * 2

    for (const [index, entry] of entries.entries()) {
        let sideMaterial: THREE.MeshBasicMaterial | null = null
        let meshMaterial: THREE.Material | THREE.Material[]

        if (isFlat && frontMaterial && background) {
            // Starts at the background colour: every letter is born asleep.
            sideMaterial = new THREE.MeshBasicMaterial({ color: background })
            ownedMaterials.push(sideMaterial)
            // ExtrudeGeometry emits two groups: 0 = the flat caps, 1 = the sides.
            meshMaterial = [frontMaterial, sideMaterial]
        }
        else {
            meshMaterial = (appearance as { material: THREE.Material }).material
        }

        const mesh = new THREE.Mesh(entry.geometry, meshMaterial)
        const restPosition = entry.position.clone()
        mesh.position.copy(restPosition)

        // Raycaster ignores `visible`, so this tracks the glyph without drawing.
        const hitbox = new THREE.Mesh(hitboxGeometry, frontMaterial ?? undefined)
        hitbox.visible = false
        hitbox.position.copy(restPosition)
        hitbox.scale.set(entry.extent.x * 1.08, entry.extent.y * 1.08, Math.max(entry.extent.z, size))
        hitbox.userData.letterIndex = index

        // Half the glyph's *narrow* dimension. Letters sit close enough on the
        // baseline that a radius drawn from the wide dimension would have them
        // permanently colliding at rest and jittering the headline apart.
        const radius = Math.min(entry.extent.x, entry.extent.y) * 0.5

        const shadowScale = new THREE.Vector2(entry.extent.x * 0.95, size * 0.26)
        let shadowMesh: THREE.Mesh | null = null

        if (shadow && shadowGeometry && shadowTexture) {
            const shadowMaterial = new THREE.MeshBasicMaterial({
                map: shadowTexture,
                transparent: true,
                depthWrite: false,
                // Born asleep, and a sleeping letter casts no shadow — at rest
                // the headline is nothing but flat type on the page.
                opacity: 0,
            })
            ownedMaterials.push(shadowMaterial)

            shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial)
            shadowMesh.position.set(restPosition.x, floors[entry.lineIndex]!, shadowZ)
            shadowMesh.scale.set(shadowScale.x, shadowScale.y, 1)
            // Draw before the glyphs so a settled letter never z-fights its shadow.
            shadowMesh.renderOrder = -1
            group.add(shadowMesh)
        }

        group.add(mesh, hitbox)
        hitboxes.push(hitbox)
        letters.push({
            mesh,
            sideMaterial,
            restColor: background,
            sideColor: isFlat
                ? new THREE.Color(SIDE_PALETTE[(index * PALETTE_STRIDE) % SIDE_PALETTE.length]!)
                : null,
            hitbox,
            shadow: shadowMesh,
            restPosition,
            velocity: new THREE.Vector3(),
            angularVelocity: new THREE.Vector3(),
            radius,
            shadowScale,
            shadowStrength: shadow ? shadow.strength : 0,
            isFlying: false,
        })
    }

    const bounds = layout.bounds.clone()
    // Extend downwards to the shadow floor and back to the shadow plane, so a
    // camera framed on these bounds keeps the decoration in shot too.
    bounds.min.y = Math.min(bounds.min.y, lowestFloor)
    bounds.min.z = Math.min(bounds.min.z, shadowZ)

    return {
        group,
        letters,
        hitboxes,
        bounds,
        setShadowsVisible: (visible: boolean) => {
            for (const letter of letters) {
                if (letter.shadow) {
                    letter.shadow.visible = visible
                }
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
            for (const material of ownedMaterials) {
                material.dispose()
            }

            hitboxGeometry.dispose()
            shadowGeometry?.dispose()
            shadowTexture?.dispose()
        },
    }
}

/**
 * Frames the headline and sizes the clip planes to match.
 *
 * A narrow FOV pushes the camera far back, and fixed 0.1/100 clip planes then
 * either clip a large glyph size outright or waste the whole depth buffer on
 * empty space, so both scale with the framing distance.
 */
export const fitCameraToBounds = (
    camera: THREE.PerspectiveCamera,
    bounds: THREE.Box3,
    margin: number,
): void => {
    const extent = bounds.getSize(new THREE.Vector3())
    const halfFov = THREE.MathUtils.degToRad(camera.fov) / 2
    const distanceForHeight = extent.y / 2 / Math.tan(halfFov)
    const distanceForWidth = extent.x / 2 / (Math.tan(halfFov) * camera.aspect)
    const distance = Math.max(distanceForHeight, distanceForWidth) * margin + extent.z

    camera.near = distance * 0.05
    camera.far = distance * 6
    camera.updateProjectionMatrix()
    camera.position.set(0, 0, distance)
    camera.lookAt(0, 0, 0)
}

const knockDirection = new THREE.Vector3()
const knockImpulse = new THREE.Vector3()
const knockLever = new THREE.Vector3()

/**
 * Kicks a letter out of its slot, away from wherever the pointer touched it.
 *
 * The forced +Z component matters: a letter shoved straight sideways stays
 * edge-on and the extrusion never becomes visible.
 *
 * The tumble is derived, not invented. Angular impulse is `r × J` — the lever
 * arm from the glyph's centre to the contact point, crossed into the linear
 * impulse — so clipping a letter by its corner spins it hard while a hit dead
 * on the centre barely turns it at all. `spin` stands in for the inverse
 * inertia tensor: a real one would vary per glyph, and at these speeds the eye
 * cannot tell, but it has to stay a knob because the units are arbitrary.
 *
 * Safe to call on a letter already in flight — the caller decides when that
 * happens, and `updateKineticLetters` caps the resulting speed.
 */
export const knockLetter = (
    letter: KineticLetter,
    contactPoint: THREE.Vector3,
    parameters: KineticMotionParameters,
): void => {
    knockDirection.subVectors(letter.mesh.position, contactPoint)
    knockDirection.z = 0

    if (knockDirection.lengthSq() < 1e-6) {
        // Hit dead-centre: there is no sideways direction, so push straight out
        // towards the viewer rather than picking one at random.
        knockDirection.set(0, 0, 1)
    }
    else {
        knockDirection.normalize()
        knockDirection.z = 0.45
    }

    knockImpulse.copy(knockDirection).multiplyScalar(parameters.impulse)
    knockImpulse.y += parameters.lift
    letter.velocity.add(knockImpulse)

    knockLever.subVectors(contactPoint, letter.mesh.position)
    letter.angularVelocity.addScaledVector(knockLever.cross(knockImpulse), parameters.spin)

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
            //
            // The spin here really is arbitrary, unlike the pointer knock: two
            // circles always meet along the line of their centres, so the lever
            // arm is parallel to the impulse and `r × J` is exactly zero. A
            // shove between discs cannot produce rotation, so the alternative
            // to a random tumble is none at all.
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

/**
 * Drives everything about a letter that follows from *how much it is moving*,
 * rather than from where it is: side colour and contact shadow.
 *
 * Split out from the spring integrator so a lesson driven by a rigid-body
 * solver can present its letters identically — the physics decides the
 * transform, this decides how the letter reads.
 *
 * `ink` is 0 for a letter at rest and 1 for one at full travel.
 */
export const updateLetterAppearance = (letter: KineticLetter, ink: number): void => {
    if (letter.sideMaterial && letter.restColor && letter.sideColor) {
        letter.sideMaterial.color.lerpColors(letter.restColor, letter.sideColor, ink)
    }

    if (letter.shadow) {
        // Only x tracks the glyph: y is the line's floor and z keeps the shadow
        // behind the text, so a letter flying at the camera does not drag it
        // out of the page.
        letter.shadow.position.x = letter.mesh.position.x

        const height = letter.mesh.position.y - letter.shadow.position.y
        const spread = 1 + Math.max(height, 0) * 0.22
        letter.shadow.scale.set(letter.shadowScale.x * spread, letter.shadowScale.y * spread, 1)
        // The shadow arrives with the movement and is gone by the time the
        // letter is home; spread² fades a lifted letter's blob as it widens.
        const shadowMaterial = letter.shadow.material as THREE.MeshBasicMaterial
        shadowMaterial.opacity = (letter.shadowStrength * ink) / spread ** 2
    }
}

/** Puts a letter exactly back in its slot: flat, uncoloured, casting nothing. */
export const parkLetter = (letter: KineticLetter): void => {
    letter.mesh.position.copy(letter.restPosition)
    letter.mesh.quaternion.identity()
    letter.hitbox.position.copy(letter.restPosition)

    if (letter.sideMaterial && letter.restColor) {
        letter.sideMaterial.color.copy(letter.restColor)
    }
    if (letter.shadow) {
        letter.shadow.position.x = letter.restPosition.x
        letter.shadow.scale.set(letter.shadowScale.x, letter.shadowScale.y, 1)
        ;(letter.shadow.material as THREE.MeshBasicMaterial).opacity = 0
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

        // How "in motion" the letter reads, and it takes the max of two cues on
        // purpose: speed alone would blink out at the top of the arc where the
        // letter is momentarily still, and travel alone would lag the first hit.
        const speedCue = letter.velocity.length() / (parameters.impulse * 0.35)
        const travelCue = distance / (settleRadius * 0.5)
        const ink = Math.min(Math.max(speedCue, travelCue), 1)

        updateLetterAppearance(letter, ink)

        // Loose thresholds on purpose: 0.004 world units is well under a pixel
        // at this camera distance, and a tighter test leaves letters awake for
        // seconds, jittering imperceptibly.
        const isStill = distance < 0.004
            && letter.velocity.lengthSq() < 1e-4
            && letter.mesh.quaternion.angleTo(REST_QUATERNION) < 0.01

        if (isStill) {
            parkLetter(letter)
            letter.velocity.set(0, 0, 0)
            letter.angularVelocity.set(0, 0, 0)
            letter.isFlying = false
        }
    }
}
