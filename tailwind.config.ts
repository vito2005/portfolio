import type { Config } from 'tailwindcss'
import designPreset from './shared/design/preset'

export default {
  presets: [designPreset],
} satisfies Partial<Config>
