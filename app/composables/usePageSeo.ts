export interface PageSeoOptions {
  title: string
  description: string
  type?: 'website' | 'article'
  /** Absolute path under `public/`; defaults to the site-wide OG image. */
  image?: string
}

/**
 * Title, description, Open Graph, Twitter, canonical and hreflang for a page.
 * The origin comes from the request so the same code works on abuki.dev and
 * on localhost; nothing here is hard-coded to a domain.
 */
export const usePageSeo = ({ title, description, type = 'website', image = '/og-image.png' }: PageSeoOptions) => {
  const route = useRoute()
  const url = useRequestURL()
  const { locale, locales, t } = useI18n()
  const switchLocalePath = useSwitchLocalePath()

  const canonicalUrl = url.origin + route.path
  const imageUrl = url.origin + image

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
      { property: 'og:site_name', content: t('seo.name') },
      { property: 'og:locale', content: locale.value === 'ru' ? 'ru_RU' : 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: imageUrl },
    ],
    link: [
      { rel: 'canonical', href: canonicalUrl },
      ...alternateLinks,
      { rel: 'alternate', hreflang: 'x-default', href: url.origin + switchLocalePath('en') },
    ],
  })
}
