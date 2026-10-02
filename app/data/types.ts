/**
 * Content types for the portfolio. Copy lives in `app/data/*.ts` as typed
 * objects rather than in the i18n JSON so that structured things (projects,
 * experience) stay one object per entry with both languages side by side.
 * UI chrome strings (nav, buttons, section titles) live in `i18n/locales`.
 */
export type LocaleCode = 'en' | 'ru'

export type Localized = Record<LocaleCode, string>

export interface ProjectLink {
  label: Localized
  href: string
}

export interface Project {
  /** Route segment: `/projects/<slug>`. */
  slug: string
  /** Brand names are not translated. */
  title: string
  /** `freelance`: built for a client outside a company (no `company` to show). */
  kind: 'work' | 'freelance' | 'side'
  /** Featured projects appear on the home page; all projects appear on `/projects`. */
  featured: boolean
  company?: string
  period?: Localized
  role: Localized
  /** One-line outcome for cards. */
  tagline: Localized
  problem: Localized
  work: Localized
  result: Localized
  stack: string[]
  links: ProjectLink[]
  /**
   * Absolute URL under `public/`, per locale: a screenshot of the product in that
   * language. A product with one language uses the same file for both.
   */
  cover: Localized
  coverAlt: Localized
  /**
   * Short muted loop for 3D work, path without extension (`/videos/hemi` →
   * hemi.webm + hemi.mp4). Plays over the cover while the card is on screen.
   */
  video?: string
}

export interface ExperienceEntry {
  company: string
  url?: string
  location: Localized
  role: Localized
  period: Localized
  summary: Localized
  /** Links the entry to its project page when there is one. */
  projectSlug?: string
  /** Before 2020: folded into one summary line instead of a full entry. */
  early?: boolean
}

export interface LabExperiment {
  /**
   * Route segment `/lab/<slug>`, and the name of its tile assets:
   * `/images/lab/<slug>.webp` and the clip `/videos/lab/<slug>.{webm,mp4}`.
   */
  slug: string
  title: Localized
  description: Localized
}
