<template>
  <div>
    <ol class="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      <li v-for="entry in recent" :key="companyName(entry)" class="grid gap-1" :class="entry.clients ? 'sm:col-span-2' : ''">
        <p class="order-last text-sm text-ink-mute">{{ pick(entry.period) }}</p>
        <div>
          <p class="font-medium text-ink">
            <NuxtLink v-if="entry.projectSlug" :to="localePath(`/projects/${entry.projectSlug}`)" class="link">{{ companyName(entry) }}</NuxtLink>
            <template v-else>{{ companyName(entry) }}</template>
            <span class="font-normal text-ink-mute"> · {{ pick(entry.location) }}</span>
          </p>
          <p class="text-ink-soft">{{ pick(entry.role) }}</p>
          <p v-if="entry.clients" class="mt-1 text-sm text-ink-mute">
            <template v-for="(group, groupIndex) in entry.clients" :key="group.via">
              <template v-if="groupIndex > 0">{{ ' · ' }}</template>
              <template v-for="(project, projectIndex) in group.projects" :key="project.name">
                <template v-if="projectIndex > 0">{{ ` ${$t('home.experience_and')} ` }}</template>
                <NuxtLink v-if="project.projectSlug" :to="localePath(`/projects/${project.projectSlug}`)" class="link text-ink">{{ project.name }}</NuxtLink>
                <template v-else>{{ project.name }}</template>
              </template>
              {{ ` ${$t('home.experience_via', { studio: group.via })}` }}
            </template>
          </p>
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
import type { ExperienceEntry } from '@/data/types'

/**
 * Work history for the home page's About section: recent jobs with role and
 * years (the company links to its case study when there is one). The pre-2020
 * jobs are folded into one line without company names: several short stints at
 * little-known companies read as job-hopping and add nothing for a reader. The
 * contract entry spans the full row and lists its client projects, linked to
 * their case studies where they have one.
 */
const localePath = useLocalePath()
const { pick } = useLocalized()

const companyName = (entry: ExperienceEntry) => typeof entry.company === 'string' ? entry.company : pick(entry.company)

const recent = experience.filter(entry => !entry.early)
const early = experience.filter(entry => entry.early)

// "2017–2020": the span covered by the folded jobs, read from their periods.
const earlyYears = computed(() => {
  const years = early.flatMap(entry => entry.period.en.match(/\d{4}/g) ?? []).map(Number)
  return years.length ? `${Math.min(...years)}–${Math.max(...years)}` : ''
})
</script>
