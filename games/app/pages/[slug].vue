<script setup lang="ts">
import { useGames } from '@/composables/useGames'

const route = useRoute()
const { findGame } = useGames()

const game = findGame(String(route.params.slug))

if (!game) {
  throw createError({ statusCode: 404, statusMessage: 'No such creative', fatal: true })
}

const url = useRequestURL()
const canonicalUrl = url.origin + route.path

const seoTitle = `${game.title} — Playable Ad Breakdown`
const seoDescription = game.tagline

useHead({
  title: seoTitle,
  meta: [
    { name: 'description', content: seoDescription },
    { property: 'og:type', content: 'article' },
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
  <article v-if="game" class="max-w-3xl">
    <NuxtLink to="/" class="text-sm text-gray-500 hover:text-gray-900 transition-colors">
      ← All creatives
    </NuxtLink>

    <h1 class="mt-6 font-serif text-4xl text-gray-900">
      {{ game.title }}
    </h1>
    <p class="mt-2 text-gray-500">
      {{ game.tagline }}
    </p>

    <p class="mt-6 text-gray-600">
      {{ game.summary }}
    </p>

    <div class="mt-8 flex flex-wrap gap-3">
      <a :href="game.playUrl" target="_blank" rel="noopener" class="btn">
        Play full screen
      </a>
    </div>

    <section class="mt-12">
      <h2 class="font-serif text-2xl text-gray-900">Numbers</h2>
      <dl class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="card">
          <dt class="text-xs uppercase tracking-wide text-gray-400">Built size</dt>
          <dd class="mt-1 text-lg font-medium text-gray-900">{{ game.builtKb }} KB</dd>
        </div>
        <div class="card">
          <dt class="text-xs uppercase tracking-wide text-gray-400">Gzipped</dt>
          <dd class="mt-1 text-lg font-medium text-gray-900">{{ game.gzipKb }} KB</dd>
        </div>
        <div class="card">
          <dt class="text-xs uppercase tracking-wide text-gray-400">Frame rate</dt>
          <dd class="mt-1 text-lg font-medium text-gray-900">{{ game.fps }} fps</dd>
        </div>
        <div class="card">
          <dt class="text-xs uppercase tracking-wide text-gray-400">Asset bytes</dt>
          <dd class="mt-1 text-lg font-medium text-gray-900">0</dd>
        </div>
      </dl>
    </section>

    <section class="mt-12">
      <h2 class="font-serif text-2xl text-gray-900">How it plays</h2>
      <ul class="mt-4 space-y-2 text-gray-600">
        <li v-for="line in game.mechanics" :key="line" class="flex gap-3">
          <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>{{ line }}</span>
        </li>
      </ul>
    </section>

    <section class="mt-12">
      <h2 class="font-serif text-2xl text-gray-900">One build per network</h2>
      <p class="mt-2 text-sm text-gray-500">
        The adapter is picked at build time, so a Unity build never carries Meta's code.
      </p>
      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[32rem] text-left text-sm">
          <thead class="text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th class="py-2 pr-4 font-medium">Network</th>
              <th class="py-2 pr-4 font-medium">Click-through</th>
              <th class="py-2 pr-4 font-medium">Limit</th>
              <th class="py-2 font-medium">Used</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="network in game.networks" :key="network.label">
              <td class="py-2 pr-4 text-gray-900">{{ network.label }}</td>
              <td class="py-2 pr-4 font-mono text-xs text-gray-600">{{ network.cta }}</td>
              <td class="py-2 pr-4 text-gray-600">{{ network.limitMb }} MB</td>
              <td class="py-2 text-gray-600">
                {{ Math.round((game.builtKb / (network.limitMb * 1024)) * 1000) / 10 }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mt-12">
      <h2 class="font-serif text-2xl text-gray-900">Built from</h2>
      <ul class="mt-4 flex flex-wrap gap-2">
        <li
          v-for="item in game.tech"
          :key="item"
          class="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600"
        >
          {{ item }}
        </li>
      </ul>
    </section>

    <section v-if="game.proofImage" class="mt-12">
      <h2 class="font-serif text-2xl text-gray-900">Validation</h2>
      <p class="mt-2 text-sm text-gray-500">
        {{ game.proofCaption }}
      </p>
      <img
        :src="game.proofImage"
        :alt="game.proofCaption"
        class="mt-4 w-full rounded-xl border border-gray-200"
        loading="lazy"
      >
    </section>
  </article>
</template>
