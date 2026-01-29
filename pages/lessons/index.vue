<template>
  <div class="mx-auto container px-4">
    <h1 class="text-3xl font-bold mb-6">Three.js Lessons</h1>
    <p class="text-gray-600 mb-8">
      Select a lesson from the dropdown menu above or click on a card below
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

useHead({
  title: "Three.js Lessons",
  meta: [{ name: "description", content: "Three.js Lessons" }],
});
</script>

<style lang="scss" scoped></style>
