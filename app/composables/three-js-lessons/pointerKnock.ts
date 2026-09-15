import * as THREE from 'three'

/**
 * Pointer→letter knock detection, shared by every kinetic-text lesson.
 *
 * The interaction feels right because of three rules that are easy to get
 * subtly wrong when re-implemented per page — which is why they live here once:
 *
 * 1. Knocks follow pointer *movement*, never the clock. The ray is cast every
 *    frame, so without this a parked cursor would keep re-hitting whatever
 *    drifted back underneath it.
 * 2. A letter is knocked on *entry* only. Hitting on every intersection would
 *    re-kick the same letter 60 times a second while the cursor crosses it.
 * 3. Leaving the canvas forgets what was hovered, so coming back in counts as
 *    a fresh entry rather than a letter that was "already hovered".
 *
 * The helper answers one question per frame — "which letters did the pointer
 * just enter, and where?" — and leaves what a knock *does* to the caller.
 */
export interface PointerKnock {
    /**
     * Call once per frame. Raycasts the pointer against `hitboxes` and invokes
     * `onEnter` for every letter the ray entered since the last call, with the
     * world-space contact point. Does nothing while the pointer is still.
     */
    update: (
        camera: THREE.Camera,
        hitboxes: THREE.Mesh[],
        onEnter: (letterIndex: number, contactPoint: THREE.Vector3) => void,
    ) => void
    /** Drop hover memory, so the next movement over a letter counts as entry. */
    forget: () => void
    /** Remove the listeners. Call from `onUnmounted`. */
    dispose: () => void
}

export const createPointerKnock = (canvas: HTMLCanvasElement): PointerKnock => {
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let isOverCanvas = false
    let hasMoved = false

    // Letters the ray was inside on the previous processed frame.
    let hovered = new Set<number>()
    let nextHovered = new Set<number>()

    /**
     * Pointer position is normalised against the canvas rect, not the window —
     * the canvas is an inset box inside the lessons layout.
     */
    const handlePointerMove = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect()
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        // Repeated events at the same coordinates are not movement.
        if (x !== pointer.x || y !== pointer.y) {
            hasMoved = true
        }

        pointer.set(x, y)
        isOverCanvas = true
    }

    const handlePointerLeave = () => {
        isOverCanvas = false
        hovered.clear()
    }

    canvas.addEventListener('pointermove', handlePointerMove)
    // A touch that lands without moving is still a deliberate poke.
    canvas.addEventListener('pointerdown', handlePointerMove)
    canvas.addEventListener('pointerleave', handlePointerLeave)

    return {
        update: (camera, hitboxes, onEnter) => {
            if (!isOverCanvas || !hasMoved) {
                return
            }
            hasMoved = false

            raycaster.setFromCamera(pointer, camera)

            nextHovered.clear()
            for (const intersection of raycaster.intersectObjects(hitboxes, false)) {
                const index = intersection.object.userData.letterIndex as number
                nextHovered.add(index)

                if (!hovered.has(index)) {
                    onEnter(index, intersection.point)
                }
            }

            const previous = hovered
            hovered = nextHovered
            nextHovered = previous
        },
        forget: () => {
            hovered.clear()
        },
        dispose: () => {
            canvas.removeEventListener('pointermove', handlePointerMove)
            canvas.removeEventListener('pointerdown', handlePointerMove)
            canvas.removeEventListener('pointerleave', handlePointerLeave)
        },
    }
}
