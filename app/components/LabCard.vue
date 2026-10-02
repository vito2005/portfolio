<template>
  <NuxtLink
    :to="localePath(labExperimentPath(experiment))"
    class="group block overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-ink-mute"
  >
    <PreviewMedia
      :src="labExperimentImage(experiment)"
      :alt="pick(experiment.title)"
      :width="800"
      :height="450"
      :video="labExperimentVideo(experiment)"
      class="aspect-video w-full border-b border-line"
    />
    <div class="p-6">
      <h2 class="font-serif text-xl tracking-tight text-ink transition-colors group-hover:text-accent-deep">
        {{ pick(experiment.title) }}
      </h2>
      <p class="mt-2 text-sm leading-relaxed text-ink-soft">{{ pick(experiment.description) }}</p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { LabExperiment } from '@/data/types'
import { labExperimentImage, labExperimentPath, labExperimentVideo } from '@/data/lab'

defineProps<{ experiment: LabExperiment }>()

const localePath = useLocalePath()
const { pick } = useLocalized()
</script>
