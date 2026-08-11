<template>
  <div class="container mx-auto">
    <div class="mb-10">
      <p class="text-xs font-semibold text-[#12b488] tracking-[0.2em] uppercase mb-3">Three.js</p>
      <h1 class="font-serif text-4xl sm:text-5xl text-gray-900">Examples</h1>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <LessonCard
        v-for="lesson in lessons"
        :key="lesson.id"
        :lesson="lesson"
        @click="navigateToLesson(lesson)"
      />
    </div>
  </div>
</template>

<script setup>
import { useLessons } from '@/composables/three-js-lessons/useLessons'
import LessonCard from '@/components/LessonCard.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

definePageMeta({
  layout: 'lessons',
  scrollsWithDocument: true,
})

const { getAllLessons } = useLessons()
const lessons = computed(() => getAllLessons())

const navigateToLesson = (lesson) => {
  router.push(lesson.path)
}

const route = useRoute()
const url = useRequestURL()
const canonicalUrl = url.origin + route.path

const seoTitle = 'Three.js Examples | Alex Buki'
const seoDescription =
  'Collection of Three.js and WebGL examples — materials, 3D text, shaders, lighting, and more.'

useHead({
  title: seoTitle,
  meta: [
    { name: 'description', content: seoDescription },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: seoTitle },
    { property: 'og:description', content: seoDescription },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:site_name', content: 'Alex Buki' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: seoTitle },
    { name: 'twitter:description', content: seoDescription },
  ],
  link: [{ rel: 'canonical', href: canonicalUrl }],
})
</script>
