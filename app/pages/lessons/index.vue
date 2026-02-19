<template>
  <div class="mx-auto container px-4">
    <h1 class="text-3xl font-bold mb-6">Three.js Examples</h1>
    <p class="text-gray-600 mb-8">
      Select an example from the dropdown menu above or click on a card below
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <LessonCard v-for="lesson in lessons" :key="lesson.id" :lesson="lesson" @click="navigateToLesson(lesson)" />
    </div>
  </div>
</template>

<script setup>
import { useLessons } from '@/composables/three-js-lessons/useLessons';
import LessonCard from '@/components/LessonCard.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

definePageMeta({
  layout: "lessons",
});

const { getAllLessons } = useLessons();

const lessons = computed(() => getAllLessons());

const navigateToLesson = (lesson) => {
  router.push(lesson.path);
};

const route = useRoute()
const url = useRequestURL()
const canonicalUrl = url.origin + route.path

const seoTitle = 'Three.js Examples | Alex Buki Developer'
const seoDescription =
  'Collection of Three.js and WebGL examples. Pick an example from the list and learn 3D graphics in the browser.'

useHead({
  title: seoTitle,
  meta: [
    { name: 'description', content: seoDescription },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: seoTitle },
    { property: 'og:description', content: seoDescription },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:site_name', content: 'Alex Buki Developer' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: seoTitle },
    { name: 'twitter:description', content: seoDescription },
  ],
  link: [{ rel: 'canonical', href: canonicalUrl }],
})
</script>

<style lang="scss" scoped></style>
