import type { Localized } from './types'

export const contacts = {
  email: 'aleksandrbuki@gmail.com',
  telegram: 'https://t.me/alexbuki',
  telegramHandle: '@alexbuki',
  linkedin: 'https://www.linkedin.com/in/aleksandr-buki',
  github: 'https://github.com/vito2005',
  githubHandle: 'vito2005',
}

/** One-page CV in the visitor's language; the PDFs live in `public/cv/`. */
export const cvFile: Localized = {
  en: '/cv/Aleksandr_Buki_CV_EN.pdf',
  ru: '/cv/Aleksandr_Buki_CV_RU.pdf',
}

/** First page of the CV as a small image, for the hover preview on the download link. */
export const cvPreview: Localized = {
  en: '/cv/Aleksandr_Buki_CV_EN.webp',
  ru: '/cv/Aleksandr_Buki_CV_RU.webp',
}

/** About section on the home page: one line on what I do, then three proof points. */
export const aboutIntro: Localized = {
  en: 'Full-stack with a front-end lean. I build design-led interfaces and take them all the way to production: SSR, tests, CI, monitoring.',
  ru: 'Фулстек с уклоном во фронтенд. Делаю интерфейсы, где важен дизайн, и довожу их до релиза: SSR, тесты, CI, мониторинг.',
}

export const aboutFacts: Localized[] = [
  {
    en: 'Mail.ru main page: performance and Web Vitals, Chrome Excellence team award (VK People Awards 2021).',
    ru: 'Главная Mail.ru: производительность и Web Vitals, командная награда Chrome Excellence (VK People Awards 2021).',
  },
  {
    en: 'Design studios POW (London) and Vide Infra: products from the first screen to launch, and 3D scenes.',
    ru: 'Дизайн-студии POW (Лондон) и Vide Infra: продукты от первого экрана до запуска и 3D-сцены.',
  },
  {
    en: 'Node and Go backend at Metamap, plus my own bots and servers.',
    ru: 'Бэкенд на Node и Go в Metamap, свои боты и серверы.',
  },
]

/**
 * Telegram channel and YouTube. The channel is about to be renamed and may
 * change topic, so the copy just says "a channel" instead of naming it.
 */
export const channels = {
  telegram: 'https://t.me/threejsweb',
  youtube: 'https://www.youtube.com/@alexbuki',
}

/**
 * The hero's tag row, front-end core first, then the backend and 3D. The laptop
 * on the hero desk types the same list, so the two never disagree.
 */
export const heroStack = ['Vue', 'Svelte', 'Node.js', 'Go', 'Three.js']
