<template>
  <NuxtLink
    :to="localePath(lesson.path)"
    class="group block overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-ink-mute"
  >
    <PreviewMedia
      :src="`/images/lab/${lesson.id}.webp`"
      :alt="pick(lesson.title)"
      :width="800"
      :height="450"
      :video="lesson.video"
      class="aspect-video w-full border-b border-line"
    />
    <div class="p-6">
      <h2 class="font-serif text-xl tracking-tight text-ink transition-colors group-hover:text-accent-deep">
        {{ pick(lesson.title) }}
      </h2>
      <p class="mt-2 text-sm leading-relaxed text-ink-soft">{{ pick(lesson.description) }}</p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Lesson } from '@/composables/three-js-lessons/useLessons'

defineProps<{ lesson: Lesson }>()

const localePath = useLocalePath()
const { pick } = useLocalized()
</script>
