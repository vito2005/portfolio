<template>
  <div class="page">
    <div class="mb-10">
      <h1 class="font-serif text-4xl tracking-tight text-ink sm:text-5xl">{{ $t('lab.title') }}</h1>
      <p class="mt-4 max-w-[60ch] leading-relaxed text-ink-soft">{{ $t('lab.subtitle') }}</p>
    </div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <LessonCard v-for="lesson in lessons" :key="lesson.id" :lesson="lesson" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLessons } from '@/composables/three-js-lessons/useLessons'

definePageMeta({
  layout: 'lessons',
  scrollsWithDocument: true,
})

const { t } = useI18n()
const { getAllLessons } = useLessons()
// Newest first, as on the home page: the latest experiment (kinetic type) leads.
const lessons = [...getAllLessons()].sort((a, b) => b.order - a.order)

usePageSeo({
  title: `${t('lab.title')} | Alex Buki`,
  description: t('lab.subtitle'),
})
</script>
