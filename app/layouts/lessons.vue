<template>
  <div
    class="flex flex-col bg-[#F9F8F6]"
    :class="scrollsWithDocument ? 'min-h-screen' : 'h-screen min-h-0 overflow-hidden'"
  >
    <header class="border-b border-gray-200 sticky top-0 z-50 bg-[#F9F8F6]">
      <nav class="container mx-auto px-6 py-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-5">
            <NuxtLink to="/" class="font-serif italic text-xl text-gray-900 tracking-tight">A.B.</NuxtLink>
            <span class="text-gray-300">|</span>
            <NuxtLink to="/lessons" class="text-sm text-gray-500 hover:text-gray-900 transition-colors">Examples</NuxtLink>
          </div>
          <Dropdown
            :options="allLessons"
            :selected-value="selectedLessonId"
            placeholder="Select example"
            label-key="title"
            value-key="id"
            subtitle-key="order"
            @select="handleLessonSelect"
          >
            <template #option="{ option }">
              <div class="flex flex-col">
                <span class="font-medium">{{ option.title }}</span>
                <span class="text-xs text-gray-500">Example {{ option.order }}</span>
              </div>
            </template>
          </Dropdown>
        </div>
      </nav>
    </header>
    <main class="flex-1 flex flex-col min-h-0 p-4">
      <slot />
    </main>
    <footer class="border-t border-gray-200">
      <div class="container mx-auto px-6 py-4 flex gap-6 text-xs text-gray-400">
        <NuxtLink to="/" class="hover:text-gray-700 transition-colors">Home</NuxtLink>
        <NuxtLink to="/lessons" class="hover:text-gray-700 transition-colors">Examples</NuxtLink>
      </div>
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

// Canvas lessons need the fixed h-screen box (that chain is what sizes the canvas).
// Document-like pages opt in to normal page scroll, so the footer sits after the
// content instead of being pinned to the bottom of the viewport.
const scrollsWithDocument = computed(() => route.meta.scrollsWithDocument === true)

const handleLessonSelect = (lesson) => {
  router.push(lesson.path)
}
</script>

<style scoped></style>
