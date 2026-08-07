import './style.css'
import { createGame } from './game.js'
import { whenReady } from './ads.js'

const canvas = document.getElementById('scene')
const game = createGame(canvas)

// The scene is built straight away so the first frame is instant, but the loop
// only starts once the ad container says the creative may play.
whenReady(() => game.run())
