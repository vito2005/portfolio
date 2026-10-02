<template>
  <div class="flex h-dvh min-h-0 flex-col overflow-hidden bg-paper">
    <SiteHeader />
    <div class="page flex items-center justify-between gap-4 py-3">
      <h1 class="min-w-0 truncate font-serif text-xl tracking-tight text-ink sm:text-2xl">
        {{ currentExperiment ? pick(currentExperiment.title) : $t('lab.title') }}
      </h1>
      <Dropdown
        :options="experimentOptions"
        :selected-value="currentExperiment?.slug ?? null"
        :placeholder="$t('lab.select')"
        label-key="title"
        value-key="slug"
        @select="handleExperimentSelect"
      >
        <template #button>
          <span class="sm:hidden">{{ $t('lab.other_short') }}</span>
          <span class="hidden sm:inline">{{ $t('lab.other') }}</span>
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
import { labExperimentPath, labExperiments } from '@/data/lab'

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { pick } = useLocalized()

// The shell is exactly one screen tall (dvh, so the iOS toolbar doesn't hide the
// bottom): header, the experiment bar, the canvas taking whatever is left (the
// flex-1 + min-h-0 chain is what sizes it), then a one-line footer.
// The switcher button says "Other experiments" (just "More" on phones, where the
// title needs the room); the current experiment is highlighted in the list.

// Experiment routes are plain folders, not a dynamic param, so the current one is
// found by matching the localized path (/lab/… or /ru/lab/…).
const currentExperiment = computed(() =>
  labExperiments.find(experiment => localePath(labExperimentPath(experiment)) === route.path) ?? null,
)

// The dropdown reads plain strings, so titles are picked for the current locale here.
const experimentOptions = computed(() =>
  labExperiments.map(experiment => ({
    slug: experiment.slug,
    title: pick(experiment.title),
    path: labExperimentPath(experiment),
  })),
)

function handleExperimentSelect(option: { path: string }) {
  router.push(localePath(option.path))
}
</script>
