<template>
  <div class="page py-12 sm:py-16">
    <h1 class="font-serif text-4xl tracking-tight text-ink sm:text-5xl">{{ $t('projects.title') }}</h1>
    <p class="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-soft">{{ $t('projects.intro') }}</p>

    <section v-for="group in groups" :key="group.kind" class="mt-14">
      <h2 class="text-sm font-medium text-ink-mute">{{ group.title }}</h2>
      <div class="mt-5 grid gap-6 sm:grid-cols-2">
        <ProjectCard v-for="project in group.items" :key="project.slug" :project="project" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { projects } from '@/data/projects'

const { t } = useI18n()

const groups = computed(() => [
  { kind: 'work', title: t('projects.work'), items: projects.filter(project => project.kind !== 'side') },
  { kind: 'side', title: t('projects.side'), items: projects.filter(project => project.kind === 'side') },
])

usePageSeo({
  title: `${t('projects.title')} | ${t('seo.name')}`,
  description: t('projects.intro'),
})
</script>
