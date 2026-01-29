<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b shadow-sm bg-white sticky top-0 z-50">
      <nav class="container mx-auto p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <NuxtLink to="/" class="text-xl font-semibold">A.B.</NuxtLink>
            |
            <NuxtLink to="/lessons" class="text-lg">Lessons</NuxtLink>
          </div>
          <Dropdown
            :options="allLessons"
            :selected-value="selectedLessonId"
            placeholder="Select lesson"
            label-key="title"
            value-key="id"
            subtitle-key="order"
            @select="handleLessonSelect"
          >
            <template #option="{ option }">
              <div class="flex flex-col">
                <span class="font-medium">{{ option.title }}</span>
                <span class="text-xs text-gray-500">Lesson {{ option.order }}</span>
              </div>
            </template>
          </Dropdown>
        </div>
      </nav>
    </header>
    <main class="flex-1 p-4">
      <slot />
    </main>
    <footer class="border-t">
      <ul class="container mx-auto p-4 flex gap-4 text-sm text-gray-600">
        <li>
          <NuxtLink to="/" class="hover:shadow-sm rounded-md p-2"
            >Home</NuxtLink
          >
        </li>
        <li>
          <NuxtLink to="/about" class="hover:shadow-sm rounded-md p-2"
            >About</NuxtLink
          >
        </li>
        <li>
          <NuxtLink to="/lessons" class="hover:shadow-sm rounded-md p-2"
            >Lessons</NuxtLink
          >
        </li>
      </ul>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLessons } from '@/composables/three-js-lessons/useLessons'

const route = useRoute()
const router = useRouter()
const { getAllLessons } = useLessons()

const allLessons = computed(() => getAllLessons())
const selectedLessonId = computed(() => route.params.id || null)

const handleLessonSelect = (lesson) => {
  router.push(lesson.path)
}
</script>

<style scoped></style>
