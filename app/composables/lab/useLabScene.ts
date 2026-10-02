import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import GUI from 'lil-gui'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'

export interface LabSceneOptions {
    /**
     * MSAA is off by default because most experiments lean on textures and don't
     * need it. Scenes built from hard vector-like edges (extruded text, flat
     * colours) do — jaggies are the whole difference there.
     */
    antialias?: boolean
    /**
     * Transparent canvas, so the page background shows through. Off for
     * experiments (they paint their own backdrop), on for the home-page avatar.
     */
    alpha?: boolean
}

export const useLabScene = (
    canvasRef: Ref<HTMLCanvasElement | null>,
    containerRef: Ref<HTMLDivElement | null>,
    options: LabSceneOptions = {},
) => {
    const canvas = canvasRef.value
    const container = containerRef.value

    if (!canvas || !container) {
        throw new Error('useLabScene must be called from onMounted, once the canvas and container refs are bound')
    }

    const sizes = {
        width: container.clientWidth,
        height: container.clientHeight
    }

    /**
     * GUI
     */
    const gui = new GUI({ container })
    // Pinned to the canvas's top-right corner (the container is `relative`).
    gui.domElement.style.position = 'absolute'
    gui.domElement.style.top = '0'
    gui.domElement.style.right = '0'
    // On phones the open panel covers a third of the scene: start it collapsed,
    // one tap on "Controls" opens it. Same breakpoint as Tailwind's `sm`.
    if (window.matchMedia('(max-width: 639px)').matches) {
        gui.close()
    }


    /**
     * HDRLoader
     */
    const hdrLoader = new HDRLoader()



    /**
     * Scene
     */
    const scene = new THREE.Scene()
    const textureLoader = new THREE.TextureLoader()
    const fontLoader = new FontLoader()


    /**
     * Camera
     */
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
    camera.position.x = 1
    camera.position.y = 1
    camera.position.z = 2
    scene.add(camera)

    /**
     * Controls
     */
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true

    /**
     * Renderer
     */
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: options.antialias ?? false,
        alpha: options.alpha ?? false,
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    /**
     * Handle resize
     *
     * The canvas is a box inside the lab layout, not the viewport — reading
     * `window.innerWidth` here over-renders and drifts the aspect ratio as soon
     * as there is header/footer chrome.
     */
    const handleResize = () => {
        sizes.width = container.clientWidth
        sizes.height = container.clientHeight

        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()

        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    window.addEventListener('resize', handleResize)

    /** Call from `onUnmounted` — the resize listener outlives the route otherwise. */
    const disposeScene = () => {
        window.removeEventListener('resize', handleResize)
    }

    return {
        camera,
        scene,
        textureLoader,
        fontLoader,
        controls,
        renderer,
        gui,
        hdrLoader,
        disposeScene
    }
}
