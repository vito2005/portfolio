import type { Config } from 'tailwindcss'
import designPreset from '../shared/design/preset'

// Same tokens as the portfolio — see shared/design/preset.ts.
export default {
  presets: [designPreset],
} satisfies Partial<Config>
