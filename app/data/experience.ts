import type { ExperienceEntry } from './types'

/** Employment history, newest first. Years only: months add noise, not trust. */
export const experience: ExperienceEntry[] = [
  {
    company: 'Vide Infra',
    url: 'https://videinfra.com',
    location: { en: 'Design studio, remote', ru: 'Дизайн-студия, удалённо' },
    role: { en: 'Lead frontend engineer', ru: 'Ведущий фронтенд-инженер' },
    period: { en: '2026 - now', ru: '2026 - сейчас' },
    summary: {
      en: 'Own everything but the backend on Sea Breeze Booking: architecture, the booking funnel, SSR, testing and releases.',
      ru: 'Отвечаю за всё, кроме бэкенда, в Sea Breeze Booking: архитектура, воронка бронирования, SSR, тесты и релизы.',
    },
    projectSlug: 'sea-breeze-booking',
  },
  {
    company: 'POW',
    url: 'https://proofofwork.studio',
    location: { en: 'Design studio, London, remote', ru: 'Дизайн-студия, Лондон, удалённо' },
    role: { en: 'Senior frontend engineer', ru: 'Ведущий фронтенд-инженер' },
    period: { en: '2024 - 2025', ru: '2024 - 2025' },
    summary: {
      en: 'Led the front end of the OSMI.AI ecosystem and built Three.js scenes for hemi.xyz.',
      ru: 'Вёл фронтенд экосистемы OSMI.AI и делал Three.js-сцены для hemi.xyz.',
    },
    projectSlug: 'osmi',
  },
  {
    company: 'Metamap',
    url: 'https://www.metamap.com',
    location: { en: 'San Francisco, remote', ru: 'Сан-Франциско, удалённо' },
    role: { en: 'Full-stack engineer', ru: 'Фулстек-инженер' },
    period: { en: '2022 - 2024', ru: '2022 - 2024' },
    summary: {
      en: 'Node.js microservices for a fintech underwriting platform used by 35 banks in Latin America.',
      ru: 'Микросервисы на Node.js для финтех-платформы андеррайтинга, которой пользуются 35 банков Латинской Америки.',
    },
    projectSlug: 'metamap',
  },
  {
    company: 'VK',
    url: 'https://vk.company',
    location: { en: 'Moscow', ru: 'Москва' },
    role: { en: 'Frontend engineer', ru: 'Фронтенд-инженер' },
    period: { en: '2020 - 2022', ru: '2020 - 2022' },
    summary: {
      en: 'Mail.ru main page and portal navigation: high-load UI, Playwright regression tests in the release pipeline, Chrome Excellence award 2021.',
      ru: 'Главная Mail.ru и портальная навигация: высоконагруженный UI, регрессионные тесты на Playwright в пайплайне релизов, награда Chrome Excellence 2021.',
    },
    projectSlug: 'mail-ru',
  },
  {
    company: 'ADV Experience',
    early: true,
    url: 'https://www.advgroup.ru',
    location: { en: 'Moscow', ru: 'Москва' },
    role: { en: 'Full-stack developer', ru: 'Full-stack разработчик' },
    period: { en: '2019 - 2020', ru: '2019 - 2020' },
    summary: {
      en: 'Customer portals for advertising clients, built end to end: Vue and Vuex on the front, Node and Koa behind, Consul microservices, CI/CD.',
      ru: 'Кабинеты для рекламных клиентов, сделаны целиком: Vue и Vuex на фронте, Node и Koa на бэке, микросервисы на Consul, CI/CD.',
    },
  },
  {
    company: 'Soft-Telematics',
    early: true,
    url: 'https://natelsys.ru',
    location: { en: 'Moscow', ru: 'Москва' },
    role: { en: 'Frontend developer', ru: 'Фронтенд-разработчик' },
    period: { en: '2019', ru: '2019' },
    summary: {
      en: 'Customer portals for GPS vehicle trackers with maps: Vue, Nuxt, Leaflet.',
      ru: 'Кабинеты клиентов для GPS-трекеров автомобилей с картами: Vue, Nuxt, Leaflet.',
    },
  },
  {
    company: 'IDS360',
    early: true,
    url: 'https://ids360.ru',
    location: { en: 'Russia', ru: 'Россия' },
    role: { en: 'Developer', ru: 'Разработчик' },
    period: { en: '2017 - 2019', ru: '2017 - 2019' },
    summary: {
      en: 'First engineering job: Node and Express on the server, jQuery, Vue and React on the client.',
      ru: 'Первая инженерная работа: Node и Express на сервере, jQuery, Vue и React на клиенте.',
    },
  },
]
