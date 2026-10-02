<template>
  <div class="page py-12 sm:py-16">
    <div class="mb-10">
      <h1 class="font-serif text-4xl tracking-tight text-ink sm:text-5xl">{{ $t('lab.title') }}</h1>
      <p class="mt-4 max-w-[60ch] leading-relaxed text-ink-soft">{{ $t('lab.subtitle') }}</p>
    </div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <LabCard v-for="experiment in labExperiments" :key="experiment.slug" :experiment="experiment" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { labExperiments } from '@/data/lab'

const { t } = useI18n()

usePageSeo({
  title: `${t('lab.title')} | ${t('seo.name')}`,
  description: t('lab.subtitle'),
})
</script>
