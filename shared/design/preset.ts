import type { Config } from 'tailwindcss'

/**
 * Design tokens shared by every site in this repo: the portfolio at the root
 * and the games site in `games/`.
 *
 * Both Tailwind configs list this as a preset, so a colour changed here changes
 * on both sites. Add tokens rather than repeating raw hex values in class names.
 */
export default {
  theme: {
    extend: {
      colors: {
        accent: '#12b488',
        paper: '#F9F8F6',
        ink: '#111111',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
} satisfies Partial<Config>
