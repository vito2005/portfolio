import type { Config } from 'tailwindcss'

/**
 * Design tokens shared by every site in this repo: the portfolio at the root
 * and the games site in `games/`.
 *
 * Both Tailwind configs list this as a preset, so a colour changed here changes
 * on both sites. Add tokens rather than repeating raw hex values in class names.
 *
 * The palette is one warm neutral family (paper → ink) plus a single accent.
 * Don't mix in Tailwind's cool `gray-*` scale next to these on the same page.
 */
export default {
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#12b488',
          deep: '#0e9a74', // hover / pressed state of the accent
          soft: '#e3f5ee', // accent-tinted background for chips and highlights
        },
        paper: {
          DEFAULT: '#F9F8F6',
          deep: '#F0EEE9', // tinted section background, still on the paper family
        },
        surface: '#FFFFFF',
        line: '#E3E0DA', // hairlines and card borders
        ink: {
          DEFAULT: '#111111',
          soft: '#4A4946', // secondary text
          mute: '#807D77', // captions, meta, placeholders (AA on paper)
        },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
} satisfies Partial<Config>
