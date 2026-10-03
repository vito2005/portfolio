// https://nuxt.com/docs/api/configuration/nuxt-config

// Yandex Metrika, production builds only: dev and local checks must not pollute the stats.
// app/plugins/yandex-metrika.client.ts adds page hits for in-app navigation and goals.
const YANDEX_METRIKA_ID = process.env.NODE_ENV === 'production' ? 106706340 : 0
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxtjs/tailwindcss', '@nuxtjs/i18n'],
  i18n: {
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'ru', language: 'ru-RU', name: 'Русский', file: 'ru.json' },
    ],
    defaultLocale: 'en',
    // English lives at the bare URL, Russian under /ru. No browser-language
    // redirect: a recruiter who opens the link must land on the page they were sent.
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
  },
  app: {
    head: {
      title: 'Alex Buki - Software Engineer',
      meta: [
        { name: 'description', content: 'Software engineer for interactive 3D and the whole product front end.' },
        // Browser chrome on phones takes the page background.
        { name: 'theme-color', content: '#F9F8F6' },
      ],
      link: [
        // Icons are made by `npm run og` from favicon.svg. SVG for browsers that take it,
        // PNG and ICO for the ones that don't (iOS address-bar suggestions among them).
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' },
      ],
      script: YANDEX_METRIKA_ID
        ? [{
            innerHTML: `
            (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}', 'ym');

            ym(${YANDEX_METRIKA_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
          `,
            type: 'text/javascript',
            defer: true,
          }]
        : [],
      noscript: YANDEX_METRIKA_ID
        ? [{
            innerHTML: `<div><img src="https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}" style="position:absolute; left:-9999px;" alt="" /></div>`,
            tagPosition: 'bodyClose',
          }]
        : [],
    },
  },
  runtimeConfig: {
    currencyKey: process.env.CURRENCY_API_KEY,
    public: {
      yandexMetrikaId: YANDEX_METRIKA_ID,
    },
  },
  css: ['~/assets/css/tailwind.css'],
  routeRules: {
    // The About page became a section of the home page; keep shared links working.
    '/about': { redirect: { to: '/#about', statusCode: 301 } },
    '/ru/about': { redirect: { to: '/ru#about', statusCode: 301 } },
    // The Lab used to live at /lessons/<course exercise number>-<slug>.
    ...labRedirects(),
  },
})

/** 301s from the old /lessons URLs (en and /ru) to /lab/<slug>. */
function labRedirects() {
  const moves: Record<string, string> = {
    '': '',
    '/11-materials': '/materials',
    '/12-text': '/3d-text',
    '/16-haunted-house': '/haunted-house',
    '/24-environment-map': '/environment-map',
    '/50-kinetic-text': '/kinetic-text',
  }
  const rules: Record<string, { redirect: { to: string, statusCode: 301 } }> = {}
  for (const prefix of ['', '/ru']) {
    for (const [from, to] of Object.entries(moves)) {
      rules[`${prefix}/lessons${from}`] = { redirect: { to: `${prefix}/lab${to}`, statusCode: 301 } }
    }
  }
  return rules
}
