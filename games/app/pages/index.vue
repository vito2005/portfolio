<script setup lang="ts">
import { useGames } from '@/composables/useGames'

const { games } = useGames()

const route = useRoute()
const url = useRequestURL()
const canonicalUrl = url.origin + route.path

const seoTitle = 'Playable Ad Creatives — Alex Buki'
const seoDescription
  = 'Interactive 3D playable ads built with vanilla three.js: one source, one self-contained '
    + 'HTML file per ad network, under 10% of the size limit.'

useHead({
  title: seoTitle,
  meta: [
    { name: 'description', content: seoDescription },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: seoTitle },
    { property: 'og:description', content: seoDescription },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:site_name', content: 'Alex Buki Playables' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: seoTitle },
    { name: 'twitter:description', content: seoDescription },
  ],
  link: [{ rel: 'canonical', href: canonicalUrl }],
})
</script>

<template>
  <div>
    <section class="max-w-2xl">
      <p class="text-sm uppercase tracking-[0.2em] text-accent">
        Playable ads
      </p>
      <h1 class="mt-3 font-serif text-4xl leading-tight text-gray-900 sm:text-5xl">
        3D creatives that fit in a few hundred kilobytes
      </h1>
      <p class="mt-5 text-gray-600">
        Interactive ads for mobile games, built with vanilla three.js. One source tree produces a
        self-contained HTML file per ad network, each with that network's own click-through wired
        in. No framework, no physics engine, no asset files.
      </p>
      <p class="mt-3 text-gray-600">
        Try them right here — every card below is the real creative running in an iframe.
      </p>
    </section>

    <section class="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <GameCard v-for="game in games" :key="game.id" :game="game" />
    </section>
  </div>
</template>
