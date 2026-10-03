<template>
  <NuxtLink
    :to="localePath(`/projects/${project.slug}`)"
    data-goal="project_open"
    :data-goal-slug="project.slug"
    class="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-ink-mute"
  >
    <PreviewMedia
      :src="cover"
      :srcset="`${smallCover} 800w, ${cover} 1440w`"
      sizes="(min-width: 1024px) 560px, (min-width: 640px) 50vw, 100vw"
      :alt="pick(project.coverAlt)"
      :width="1440"
      :height="720"
      :video="project.video"
      img-position="object-top"
      class="aspect-[2/1] w-full border-b border-line md:aspect-auto md:h-[calc((min(100vw,72rem)-4.5rem)/4)]"
    />
    <div class="flex flex-1 flex-col p-6">
      <p class="flex flex-wrap justify-between gap-x-4 text-xs text-ink-mute">
        <span>{{ project.company ?? $t(projectOriginKey(project)) }}</span>
        <span v-if="project.period">{{ pick(project.period) }}</span>
      </p>
      <h3 class="mt-2 font-serif text-2xl tracking-tight text-ink transition-colors group-hover:text-accent-deep">
        {{ project.title }}
      </h3>
      <p class="mt-2 leading-relaxed text-ink-soft">{{ pick(project.tagline) }}</p>
      <ul class="mt-auto flex flex-wrap gap-2 pt-5">
        <li v-for="tag in project.stack.slice(0, 4)" :key="tag">
          <TechTag>{{ tag }}</TechTag>
        </li>
      </ul>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Project } from '@/data/types'
import { projectOriginKey } from '@/data/projects'

const { project } = defineProps<{ project: Project }>()

const localePath = useLocalePath()
const { pick } = useLocalized()

// Every cover ships as `<name>.webp` (1440 wide) and `<name>-800.webp` for small cards.
const cover = computed(() => pick(project.cover))
const smallCover = computed(() => cover.value.replace(/\.webp$/, '-800.webp'))

// From md up the cover has one height for every card, so a row of a wide and a
// narrow card (7/5 columns on the home page) lines up instead of leaving a gap
// under the shorter cover. The height is a quarter of the two cards' combined
// width: the .page content (min(100vw, 72rem) minus 3rem padding) minus the 1.5rem
// gap. In two equal columns (/projects) that is exactly 2:1; in 7/5 the wide
// cover crops a little at the bottom and the narrow one at the sides.
</script>
