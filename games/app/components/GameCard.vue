<script setup lang="ts">
import type { Game } from '@/composables/useGames'
import { tightestFit } from '@/composables/useGames'

const props = defineProps<{ game: Game }>()

const fit = computed(() => tightestFit(props.game))
</script>

<template>
  <article class="card flex flex-col gap-4">
    <!-- The creative itself, running in a phone-shaped frame -->
    <div class="relative mx-auto w-full max-w-[260px] aspect-[9/16] overflow-hidden rounded-2xl border-8 border-gray-900 bg-gray-900 shadow-lg">
      <iframe
        :src="game.playUrl"
        :title="game.title"
        class="h-full w-full border-0"
        loading="lazy"
      />
    </div>

    <div>
      <h2 class="font-serif text-2xl text-gray-900">
        {{ game.title }}
      </h2>
      <p class="mt-1 text-sm text-gray-500">
        {{ game.tagline }}
      </p>
    </div>

    <dl class="grid grid-cols-3 gap-3 text-center">
      <div>
        <dt class="text-xs uppercase tracking-wide text-gray-400">Size</dt>
        <dd class="text-sm font-medium text-gray-900">{{ game.builtKb }} KB</dd>
      </div>
      <div>
        <dt class="text-xs uppercase tracking-wide text-gray-400">Gzip</dt>
        <dd class="text-sm font-medium text-gray-900">{{ game.gzipKb }} KB</dd>
      </div>
      <div>
        <dt class="text-xs uppercase tracking-wide text-gray-400">Networks</dt>
        <dd class="text-sm font-medium text-gray-900">{{ game.networks.length }}</dd>
      </div>
    </dl>

    <p class="text-xs text-gray-400">
      {{ fit.percent }}% of the tightest limit ({{ fit.label }})
    </p>

    <div class="mt-auto flex flex-wrap gap-3">
      <a :href="game.playUrl" target="_blank" rel="noopener" class="btn">
        Play full screen
      </a>
      <NuxtLink :to="`/${game.id}`" class="btn-outline">
        Breakdown
      </NuxtLink>
    </div>
  </article>
</template>
