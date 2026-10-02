import { labExperiments } from '../../app/data/lab'
import { projects } from '../../app/data/projects'

const LOCALES = [
  { code: 'en', hreflang: 'en-US', prefix: '' },
  { code: 'ru', hreflang: 'ru-RU', prefix: '/ru' },
] as const

/**
 * Every page in both languages, each with its hreflang alternates so search
 * engines pair /x with /ru/x (English is the x-default, as in usePageSeo).
 * Built from the same data as the routes, so a new project or Lab experiment
 * shows up here without touching this file. The origin comes from the request.
 */
export default defineEventHandler((event) => {
  const origin = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin
  const paths = [
    '/',
    '/projects',
    ...projects.map(project => `/projects/${project.slug}`),
    '/lab',
    ...labExperiments.map(experiment => `/lab/${experiment.slug}`),
  ]
  const href = (path: string, prefix: string) => origin + (path === '/' ? prefix || '/' : prefix + path)

  const urls = paths.flatMap(path => LOCALES.map(({ prefix }) => {
    const alternates = LOCALES.map(locale =>
      `<xhtml:link rel="alternate" hreflang="${locale.hreflang}" href="${href(path, locale.prefix)}"/>`,
    ).join('')
    const fallback = `<xhtml:link rel="alternate" hreflang="x-default" href="${href(path, '')}"/>`
    return `<url><loc>${href(path, prefix)}</loc>${alternates}${fallback}</url>`
  }))

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>\n`
})
