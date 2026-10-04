<template>
  <article class="page py-12 sm:py-16">
    <NuxtLink :to="localePath('/projects')" class="link text-sm text-ink-soft">{{ $t('projects.back') }}</NuxtLink>

    <h1 class="mt-6 font-serif text-4xl tracking-tight text-ink sm:text-5xl">{{ project.title }}</h1>
    <p class="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-soft">{{ pick(project.tagline) }}</p>

    <dl class="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
      <div>
        <dt class="text-ink-mute">{{ $t('projects.role') }}</dt>
        <dd class="mt-1 text-ink">{{ pick(project.role) }}</dd>
      </div>
      <div>
        <dt class="text-ink-mute">{{ $t('projects.company') }}</dt>
        <dd class="mt-1 text-ink">{{ project.company ?? $t(projectOriginKey(project)) }}</dd>
      </div>
      <div v-if="project.period">
        <dt class="text-ink-mute">{{ $t('projects.period') }}</dt>
        <dd class="mt-1 text-ink">{{ pick(project.period) }}</dd>
      </div>
    </dl>

    <PreviewMedia
      :src="pick(project.cover)"
      :alt="pick(project.coverAlt)"
      :width="1440"
      :height="720"
      :video="project.video"
      eager
      img-position="object-top"
      class="mt-10 aspect-[2/1] w-full rounded-xl border border-line"
    />

    <div class="mt-12 grid gap-12 lg:grid-cols-12">
      <div class="space-y-10 lg:col-span-8">
        <section v-for="block in blocks" :key="block.title">
          <h2 class="font-serif text-2xl tracking-tight text-ink">{{ block.title }}</h2>
          <p class="mt-3 max-w-[65ch] leading-relaxed text-ink-soft">{{ block.text }}</p>
        </section>
      </div>
      <aside class="space-y-8 lg:col-span-4">
        <div>
          <h2 class="text-sm font-medium text-ink-mute">{{ $t('projects.stack') }}</h2>
          <ul class="mt-3 flex flex-wrap gap-2">
            <li v-for="tag in project.stack" :key="tag">
              <TechTag>{{ tag }}</TechTag>
            </li>
          </ul>
        </div>
        <div>
          <h2 class="text-sm font-medium text-ink-mute">{{ $t('projects.links') }}</h2>
          <ul class="mt-3 space-y-2">
            <li v-for="item in project.links" :key="item.href">
              <a :href="item.href" target="_blank" rel="noopener noreferrer" class="link text-ink" data-goal="project_link" :data-goal-slug="project.slug">{{ pick(item.label) }}</a>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </article>
</template>

<script setup lang="ts">
import { findProject, projectOriginKey } from '@/data/projects'

const route = useRoute()
const localePath = useLocalePath()
const { pick } = useLocalized()
const { t } = useI18n()

const project = findProject(String(route.params.slug))
if (!project) {
  throw createError({ statusCode: 404, statusMessage: t('projects.not_found') })
}

const blocks = computed(() => [
  { title: t('projects.problem'), text: pick(project.problem) },
  { title: t('projects.work_done'), text: pick(project.work) },
  { title: t('projects.result'), text: pick(project.result) },
])

usePageSeo({
  title: `${project.title} | ${t('seo.name')}`,
  description: pick(project.tagline),
  type: 'article',
  card: `projects/${project.slug}`,
})
</script>
