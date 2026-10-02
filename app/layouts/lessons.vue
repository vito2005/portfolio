<template>
  <div class="flex h-dvh min-h-0 flex-col overflow-hidden bg-paper">
    <SiteHeader />
    <div class="page flex items-center justify-between gap-4 py-3">
      <h1 class="min-w-0 truncate font-serif text-xl tracking-tight text-ink sm:text-2xl">
        {{ currentLesson ? pick(currentLesson.title) : $t('lab.title') }}
      </h1>
      <Dropdown
        :options="lessonOptions"
        :selected-value="currentLesson?.id ?? null"
        :placeholder="$t('lab.select')"
        label-key="title"
        value-key="id"
        @select="handleLessonSelect"
      >
        <template #button>
          <span class="sm:hidden">{{ $t('lab.other_short') }}</span>
          <span class="hidden sm:inline">{{ $t('lab.other') }}</span>
        </template>
        <template #option="{ option }">
          <div class="flex flex-col">
            <span class="font-medium">{{ option.title }}</span>
            <span class="text-xs text-ink-mute">{{ $t('lab.experiment') }} {{ option.order }}</span>
          </div>
        </template>
      </Dropdown>
    </div>
    <main class="page flex min-h-0 flex-1 flex-col pb-4">
      <slot />
    </main>
    <SiteFooter compact />
  </div>
</template>

<script setup lang="ts">
import { useLessons } from '@/composables/three-js-lessons/useLessons'

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { pick } = useLocalized()
const { getAllLessons } = useLessons()

// The shell is exactly one screen tall (dvh, so the iOS toolbar doesn't hide the
// bottom): header, the lesson bar, the canvas taking whatever is left (the
// flex-1 + min-h-0 chain is what sizes it), then a one-line footer.
// The switcher button says "Other experiments" (just "More" on phones, where the
// lesson title needs the room); the current lesson is highlighted in the list.

// Lesson routes are plain folders, not a dynamic param, so the current lesson is
// found by matching the localized path (/lessons/… or /ru/lessons/…).
const currentLesson = computed(() =>
  getAllLessons().find(lesson => localePath(lesson.path) === route.path) ?? null,
)

// Newest first, as on the Lab page. The dropdown reads plain strings, so titles
// are picked for the current locale here.
const lessonOptions = computed(() =>
  [...getAllLessons()]
    .sort((a, b) => b.order - a.order)
    .map(lesson => ({ ...lesson, title: pick(lesson.title) })),
)

function handleLessonSelect(lesson: { path: string }) {
  router.push(localePath(lesson.path))
}
</script>
