export interface PageSeoOptions {
  title: string
  description: string
  type?: 'website' | 'article'
  /**
   * Share card made by `npm run og` (tools/og/generate.ts): `public/og/<card>-<locale>.jpg`,
   * e.g. `projects/hemi`. Defaults to the home card.
   */
  card?: string
}

/**
 * Title, description, Open Graph, Twitter, canonical and hreflang for a page.
 * The origin comes from the request so the same code works on abuki.dev and
 * on localhost; nothing here is hard-coded to a domain.
 */
/**
 * Bump after `npm run og` regenerates the cards: messengers cache a preview image
 * by URL (Telegram even caches a failed fetch), and a new query string makes them
 * fetch it again.
 */
const OG_CARD_VERSION = 2

export const usePageSeo = ({ title, description, type = 'website', card = 'home' }: PageSeoOptions) => {
  const route = useRoute()
  const url = useRequestURL()
  const { locale, locales, t } = useI18n()
  const switchLocalePath = useSwitchLocalePath()

  const canonicalUrl = url.origin + route.path
  const imageUrl = `${url.origin}/og/${card}-${locale.value}.jpg?v=${OG_CARD_VERSION}`

  const alternateLinks = locales.value.map(entry => ({
    rel: 'alternate',
    hreflang: entry.language ?? entry.code,
    href: url.origin + switchLocalePath(entry.code),
  }))

  useHead({
    htmlAttrs: { lang: locale.value },
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:type', content: type },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: imageUrl },
      // Size up front, so messengers lay out the large preview before fetching the image.
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: 'image/jpeg' },
      { property: 'og:image:alt', content: title },
      { property: 'og:site_name', content: t('seo.name') },
      { property: 'og:locale', content: locale.value === 'ru' ? 'ru_RU' : 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: imageUrl },
      { name: 'twitter:image:alt', content: title },
    ],
    link: [
      { rel: 'canonical', href: canonicalUrl },
      ...alternateLinks,
      { rel: 'alternate', hreflang: 'x-default', href: url.origin + switchLocalePath('en') },
    ],
  })
}
