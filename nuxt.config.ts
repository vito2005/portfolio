// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxtjs/tailwindcss'],
  app: {
    head: {
      title: 'Alex Buki - Software Engineer',
      meta: [
        { name: 'description', content: 'Alex Buki Portfolio' },

      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' },
      ],
      script: [
        {
          innerHTML: `
            (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=106706340', 'ym');

            ym(106706340, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
          `,
          type: 'text/javascript',
          defer: true,
        },
      ],
      noscript: [
        {
          innerHTML: '<div><img src="https://mc.yandex.ru/watch/106706340" style="position:absolute; left:-9999px;" alt="" /></div>',
          tagPosition: 'bodyClose'
        }
      ]
    },
  },
  runtimeConfig: {
    currencyKey: process.env.CURRENCY_API_KEY
  },
  css: ['~/assets/css/tailwind.css'],
})