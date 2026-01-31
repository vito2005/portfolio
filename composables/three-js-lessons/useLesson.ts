import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import GUI from 'lil-gui'


export const useLesson = (canvasRef: Ref<HTMLCanvasElement>, containerRef: Ref<HTMLDivElement>) => {
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight,
    }

    /**
     * GUI
     */
    const gui = new GUI({ container: containerRef.value })


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
    const controls = new OrbitControls(camera, canvasRef.value)
    controls.enableDamping = true

    /**
     * Renderer
     */
    const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.value,
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    /**
     * Handle resize
     */
    const handleResize = () => {
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight

        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()

        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    window.addEventListener('resize', handleResize)

    return {
        camera,
        scene,
        textureLoader,
        fontLoader,
        controls,
        renderer,
        gui
    }
}