export interface GameNetwork {
  /** Network name as the studio would say it. */
  label: string
  /** The call that sends a player to the store. */
  cta: string
  /** Size ceiling that network puts on a playable, in megabytes. */
  limitMb: number
}

export interface Game {
  id: string
  title: string
  tagline: string
  /** One paragraph for the case page. */
  summary: string
  /** How it plays, one line each. */
  mechanics: string[]
  /** Path to the playable itself, served untouched from `public/`. */
  playUrl: string
  builtKb: number
  gzipKb: number
  fps: number
  sourceLines: number
  /** Everything the creative is built from. */
  tech: string[]
  networks: GameNetwork[]
  /** Screenshot of a passed network validation, if there is one. */
  proofImage?: string
  proofCaption?: string
}

const GAMES: Game[] = [
  {
    id: 'marble-run',
    title: 'Marble Rush',
    tagline: 'Swipe-steered 3D runner, built as an ad creative',
    summary:
      'A marble rolls down a track on its own; you swipe to steer it around four kinds of obstacle '
      + 'and collect gems on the way. One source tree builds a self-contained HTML file for each ad '
      + 'network, with that network\'s own click-through wired in. No framework, no physics engine '
      + 'and no asset files — every shape, texture and sound is generated in code.',
    mechanics: [
      'One finger, one axis: drag anywhere to steer.',
      'Four obstacle types, each solvable with that single input.',
      'Three lives, roughly 20 seconds to the finish.',
      'Hit an obstacle and it bounces you back — but each one can only cost a life once.',
    ],
    playUrl: '/playables/marble-run/index.html',
    builtKb: 503,
    gzipKb: 131,
    fps: 60,
    sourceLines: 1550,
    tech: ['three.js', 'Vite', 'single-file build', 'custom collision', 'WebAudio', 'canvas textures'],
    networks: [
      { label: 'Google Ads (App campaigns)', cta: 'ExitApi.exit()', limitMb: 5 },
      { label: 'Unity Ads', cta: 'mraid.open()', limitMb: 5 },
      { label: 'AppLovin', cta: 'mraid.open()', limitMb: 5 },
      { label: 'ironSource', cta: 'dapi.openStoreUrl()', limitMb: 5 },
      { label: 'Mintegral', cta: 'install()', limitMb: 3 },
      { label: 'Meta', cta: 'FbPlayableAd.onCTAClick()', limitMb: 2 },
    ],
    proofImage: '/playables/marble-run/google-validator.png',
    proofCaption: 'Google H5 validator, App campaigns mode — 23 checks, 0 errors',
  },
  {
    id: 'sort-3d',
    title: 'Shelf Sort',
    tagline: 'Tap-to-move sorting puzzle on a 3D rack',
    summary:
      'Twelve items, four kinds, one empty shelf and fourteen moves. Tap an item, tap a free slot, '
      + 'and get three of a kind onto one shelf to clear it. A different genre and a different '
      + 'input from the runners — raycast taps instead of a swipe — on the same shared engine and '
      + 'the same build pipeline.',
    mechanics: [
      'Tap an item, then tap a free slot. Free slots light up while something is in hand.',
      'Three of a kind on one shelf clears it.',
      'Every kind has its own shape as well as its own colour, so it reads without relying on hue.',
      'The board is hand-authored, never shuffled: a random layout can be unsolvable.',
    ],
    playUrl: '/playables/sort-3d/index.html',
    builtKb: 503,
    gzipKb: 131,
    fps: 60,
    sourceLines: 1065,
    tech: ['three.js', 'raycast picking', 'colour-blind safe shapes', 'WebAudio', 'Vite'],
    networks: [
      { label: 'Google Ads (App campaigns)', cta: 'ExitApi.exit()', limitMb: 5 },
      { label: 'Unity Ads', cta: 'mraid.open()', limitMb: 5 },
      { label: 'AppLovin', cta: 'mraid.open()', limitMb: 5 },
      { label: 'ironSource', cta: 'dapi.openStoreUrl()', limitMb: 5 },
      { label: 'Mintegral', cta: 'install()', limitMb: 3 },
      { label: 'Meta', cta: 'FbPlayableAd.onCTAClick()', limitMb: 2 },
    ],
  },
]

export interface UseGames {
  games: Game[]
  findGame: (id: string) => Game | undefined
}

/** Single source of truth for the showcase — there is no filesystem scan. */
export function useGames(): UseGames {
  return {
    games: GAMES,
    findGame: (id: string) => GAMES.find(game => game.id === id),
  }
}

/** Share of a network's limit this build takes up, for the tightest network. */
export function tightestFit(game: Game): { label: string; percent: number } {
  const tightest = game.networks.reduce((worst, network) => (
    network.limitMb < worst.limitMb ? network : worst
  ))
  return {
    label: tightest.label,
    percent: Math.round((game.builtKb / (tightest.limitMb * 1024)) * 1000) / 10,
  }
}
