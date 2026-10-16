import type { ExperienceEntry } from './types'

/**
 * Employment history, newest first. Years only: months add noise, not trust.
 * The studio work since 2024 is one contract entry, as in the CV, so it reads
 * as one line of work rather than two short jobs.
 */
export const experience: ExperienceEntry[] = [
  {
    company: { en: 'Contract development', ru: 'Контрактная разработка' },
    location: { en: 'Remote', ru: 'Удалённо' },
    role: { en: 'Senior full-stack engineer', ru: 'Ведущий фулстек-инженер' },
    period: { en: '2024 – now', ru: '2024 – сейчас' },
    clients: [
      { via: 'Vide Infra', projects: [{ name: 'Sea Breeze', projectSlug: 'sea-breeze-booking' }, { name: 'Tekta' }] },
      { via: 'POW', projects: [{ name: 'OSMI.AI', projectSlug: 'osmi' }, { name: 'hemi.xyz', projectSlug: 'hemi' }] },
    ],
  },
  {
    company: 'Metamap',
    url: 'https://www.metamap.com',
    location: { en: 'San Francisco, remote', ru: 'Сан-Франциско, удалённо' },
    role: { en: 'Full-stack engineer', ru: 'Фулстек-инженер' },
    period: { en: '2022–2024', ru: '2022–2024' },
    projectSlug: 'metamap',
  },
  {
    company: 'VK',
    url: 'https://vk.company',
    location: { en: 'Moscow', ru: 'Москва' },
    role: { en: 'Frontend engineer', ru: 'Фронтенд-инженер' },
    period: { en: '2020–2022', ru: '2020–2022' },
    projectSlug: 'mail-ru',
  },
  {
    company: 'ADV Experience',
    early: true,
    url: 'https://www.advgroup.ru',
    location: { en: 'Moscow', ru: 'Москва' },
    role: { en: 'Full-stack developer', ru: 'Full-stack разработчик' },
    period: { en: '2019–2020', ru: '2019–2020' },
  },
  {
    company: 'Soft-Telematics',
    early: true,
    url: 'https://natelsys.ru',
    location: { en: 'Moscow', ru: 'Москва' },
    role: { en: 'Frontend developer', ru: 'Фронтенд-разработчик' },
    period: { en: '2019', ru: '2019' },
  },
  {
    company: 'IDS360',
    early: true,
    url: 'https://ids360.ru',
    location: { en: 'Russia', ru: 'Россия' },
    role: { en: 'Developer', ru: 'Разработчик' },
    period: { en: '2017–2019', ru: '2017–2019' },
  },
]
