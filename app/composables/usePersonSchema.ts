import { channels, contacts, heroStack } from '@/data/profile'

/**
 * schema.org Person + WebSite for the home page, the data search engines use for
 * a person card: name in the current language, role, where else to find me.
 * Everything comes from app/data and i18n, so it stays in step with the page.
 */
export const usePersonSchema = () => {
  const url = useRequestURL()
  const localePath = useLocalePath()
  const { t, locale } = useI18n()

  const personId = `${url.origin}/#person`
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        'name': t('seo.name'),
        // The RU title uses a non-breaking hyphen for layout; plain text here.
        'jobTitle': t('hero.title').replace('‑', '-'),
        'url': url.origin + localePath('/'),
        'image': `${url.origin}/og/home-${locale.value}.jpg`,
        'email': `mailto:${contacts.email}`,
        'knowsAbout': heroStack,
        'worksFor': { '@type': 'Organization', 'name': 'Vide Infra', 'url': 'https://videinfra.com' },
        'sameAs': [contacts.github, contacts.linkedin, contacts.telegram, channels.youtube],
      },
      {
        '@type': 'WebSite',
        '@id': `${url.origin}/#website`,
        'url': url.origin,
        'name': t('seo.name'),
        'inLanguage': locale.value,
        'publisher': { '@id': personId },
      },
    ],
  }

  useHead({
    script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(schema) }],
  })
}
