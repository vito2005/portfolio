import type { LabExperiment } from './types'

/**
 * The Lab, newest first: the order the Lab page and the experiment switcher show.
 * This list is the single source of truth: routes are not scanned, so an
 * experiment that isn't here is unreachable from the UI.
 */
export const labExperiments: LabExperiment[] = [
  {
    slug: 'kinetic-text',
    title: { en: 'Kinetic Text', ru: 'Кинетический текст' },
    description: { en: 'Extruded per-letter type that scatters on hover and springs back into the headline', ru: 'Объёмные буквы разлетаются от курсора и пружиной возвращаются в заголовок' },
  },
  {
    slug: 'environment-map',
    title: { en: 'Environment Map', ru: 'Карта окружения' },
    description: { en: 'Environment maps and HDR lighting in Three.js', ru: 'Карты окружения и HDR-освещение в Three.js' },
  },
  {
    slug: 'haunted-house',
    title: { en: 'Haunted House', ru: 'Дом с привидениями' },
    description: { en: 'A haunted house scene with textures, lights, shadows and fog', ru: 'Сцена с текстурами, светом, тенями и туманом' },
  },
  {
    slug: '3d-text',
    title: { en: '3D Text', ru: '3D-текст' },
    description: { en: 'Extruded 3D type with Three.js', ru: 'Объёмный текст на Three.js' },
  },
  {
    slug: 'materials',
    title: { en: 'Materials', ru: 'Материалы' },
    description: { en: 'Physical materials in Three.js: metal, glass and transmission', ru: 'Физические материалы в Three.js: металл, стекло, прозрачность' },
  },
]

export const findLabExperiment = (slug: string): LabExperiment | undefined =>
  labExperiments.find(experiment => experiment.slug === slug)

/** Unlocalized route; pass it through `localePath()` for links. */
export const labExperimentPath = (experiment: LabExperiment): string => `/lab/${experiment.slug}`

/** Tile still, also the share preview. */
export const labExperimentImage = (experiment: LabExperiment): string => `/images/lab/${experiment.slug}.webp`

/** Tile clip without extension: PreviewMedia adds `.webm` and `.mp4`. */
export const labExperimentVideo = (experiment: LabExperiment): string => `/videos/lab/${experiment.slug}`
