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
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' },
      ],
    },
  },
  runtimeConfig: {
    currencyKey: process.env.CURRENCY_API_KEY
  },
  css: ['~/assets/css/tailwind.css'],
})