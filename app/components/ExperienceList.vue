<template>
  <div>
    <ol class="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      <li v-for="entry in recent" :key="entry.company" class="grid gap-1">
        <p class="order-last text-sm text-ink-mute">{{ pick(entry.period) }}</p>
        <div>
          <p class="font-medium text-ink">
            <NuxtLink v-if="entry.projectSlug" :to="localePath(`/projects/${entry.projectSlug}`)" class="link">{{ entry.company }}</NuxtLink>
            <template v-else>{{ entry.company }}</template>
            <span class="font-normal text-ink-mute"> · {{ pick(entry.location) }}</span>
          </p>
          <p class="text-ink-soft">{{ pick(entry.role) }}</p>
        </div>
      </li>
    </ol>
    <p v-if="early.length" class="mt-6 text-sm text-ink-mute">
      {{ $t('home.experience_early', { years: earlyYears }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { experience } from '@/data/experience'

/**
 * Work history for the home page's About section: recent jobs with role and
 * years (the company links to its case study when there is one). The pre-2020
 * jobs are folded into one line without company names: several short stints at
 * little-known companies read as job-hopping and add nothing for a reader.
 */
const localePath = useLocalePath()
const { pick } = useLocalized()

const recent = experience.filter(entry => !entry.early)
const early = experience.filter(entry => entry.early)

// "2017–2020": the span covered by the folded jobs, read from their periods.
const earlyYears = computed(() => {
  const years = early.flatMap(entry => entry.period.en.match(/\d{4}/g) ?? []).map(Number)
  return years.length ? `${Math.min(...years)}–${Math.max(...years)}` : ''
})
</script>
