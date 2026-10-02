<template>
  <div class="page">
    <section class="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-12 lg:gap-12">
      <div class="lg:col-span-7">
        <p class="rise text-xs font-medium uppercase tracking-[0.18em] text-accent-ink">{{ $t('hero.eyebrow') }}</p>
        <h1 class="rise mt-4 font-serif text-[8.6vw] leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem] xl:text-[3.6rem]">
          {{ $t('hero.title') }}
        </h1>
        <p class="rise rise-delay mt-6 max-w-[40ch] text-lg leading-relaxed text-ink-soft sm:text-xl">{{ $t('hero.subtitle') }}</p>
        <i18n-t keypath="hero.now" tag="p" class="rise rise-delay mt-3 text-sm text-ink-mute sm:text-base">
          <template #studio>
            <a href="https://videinfra.com" target="_blank" rel="noopener noreferrer" class="link text-ink">Vide Infra</a>
          </template>
        </i18n-t>
        <div class="rise rise-delay mt-8 flex flex-wrap gap-3">
          <NuxtLink :to="localePath('/projects')" class="btn">{{ $t('hero.cta_projects') }}</NuxtLink>
          <a href="#contact" class="btn-outline">{{ $t('hero.cta_contact') }}</a>
        </div>
        <ul class="rise rise-delay mt-10 flex flex-wrap gap-2" :aria-label="$t('hero.stack_label')">
          <li v-for="tech in HERO_STACK" :key="tech">
            <TechTag>{{ tech }}</TechTag>
          </li>
        </ul>
      </div>
      <div class="lg:col-span-5">
        <HeroAvatar />
      </div>
    </section>

    <section class="border-t border-line py-16 sm:py-24">
      <SectionTitle>
        {{ $t('home.projects_title') }}
        <template #aside>
          <NuxtLink :to="localePath('/projects')" class="link text-ink">{{ $t('home.projects_all') }}</NuxtLink>
        </template>
      </SectionTitle>
      <!-- Four cards in two uneven rows (7/5 then 5/7) so the grid has a rhythm instead of four equal boxes. -->
      <div class="mt-10 grid gap-6 md:grid-cols-12">
        <ProjectCard
          v-for="(project, index) in featured"
          :key="project.slug"
          :project="project"
          :class="index % 4 === 0 || index % 4 === 3 ? 'md:col-span-7' : 'md:col-span-5'"
        />
      </div>
    </section>

    <section class="border-t border-line py-16 sm:py-24">
      <SectionTitle>
        {{ $t('home.lab_title') }}
        <template #aside>
          <NuxtLink :to="localePath('/lessons')" class="link text-ink">{{ $t('home.lab_all') }}</NuxtLink>
        </template>
      </SectionTitle>
      <p class="mt-4 max-w-[60ch] leading-relaxed text-ink-soft">{{ $t('home.lab_text') }}</p>
      <div class="-mx-6 mt-10 overflow-hidden sm:mx-0 sm:overflow-visible">
        <ul
          ref="labSliderRef"
          class="sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
          :class="isLabSliderActive ? 'keen-slider mx-6 !w-auto !overflow-visible' : 'flex snap-x gap-4 overflow-x-auto px-6 pb-2 sm:px-0'"
        >
          <li
            v-for="lesson in lessons"
            :key="lesson.id"
            :class="isLabSliderActive ? 'keen-slider__slide !overflow-visible' : 'w-64 flex-none snap-start sm:w-auto'"
          >
            <NuxtLink :to="localePath(lesson.path)" class="group block">
              <PreviewMedia
                :src="`/images/lab/${lesson.id}.webp`"
                :alt="lesson.title"
                :width="800"
                :height="450"
                :video="lesson.video"
                class="aspect-video w-full rounded-xl border border-line transition-colors group-hover:border-ink-mute"
              />
              <p class="mt-3 font-medium text-ink transition-colors group-hover:text-accent-deep">{{ lesson.title }}</p>
              <p class="mt-1 text-sm leading-relaxed text-ink-soft">{{ lesson.description }}</p>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>

    <section id="about" class="scroll-mt-20 grid gap-10 border-t border-line py-16 sm:py-24 lg:grid-cols-12 lg:gap-16">
      <div class="lg:col-span-5">
        <SectionTitle>{{ $t('home.about_title') }}</SectionTitle>
        <p class="mt-5 leading-relaxed text-ink-soft">{{ pick(aboutIntro) }}</p>
        <ul class="mt-5 list-disc space-y-2 pl-5 leading-relaxed text-ink-soft marker:text-ink-mute">
          <li v-for="(fact, index) in aboutFacts" :key="index">{{ pick(fact) }}</li>
        </ul>
        <i18n-t keypath="home.channels" tag="p" class="mt-6 text-sm text-ink-mute">
          <template #telegram>
            <a :href="channels.telegram" target="_blank" rel="noopener noreferrer" class="link text-ink">Telegram</a>
          </template>
          <template #youtube>
            <a :href="channels.youtube" target="_blank" rel="noopener noreferrer" class="link text-ink">YouTube</a>
          </template>
        </i18n-t>
      </div>
      <div class="lg:col-span-7">
        <p class="text-sm font-medium text-ink-mute">{{ $t('home.experience_title') }}</p>
        <ExperienceList class="mt-5" />
      </div>
    </section>

    <div class="border-t border-line py-16 sm:py-24">
      <ContactSection />
    </div>
  </div>
</template>

<script setup lang="ts">
import { featuredProjects } from '@/data/projects'
import { aboutFacts, aboutIntro, channels } from '@/data/profile'
import { useLessons, type Lesson } from '@/composables/three-js-lessons/useLessons'

// The page ends with ContactSection, so the footer drops its own contact links.
definePageMeta({ hasContactSection: true })

const localePath = useLocalePath()
const { pick } = useLocalized()
const { t } = useI18n()

// The RU hero title uses a non-breaking hyphen and the h1 sizes above are measured so
// «Инженер‑разработчик.» stays on one line from 360px phones up to wide desktops.
// What the hero's tag row shows: the front-end core first, then the backend and 3D.
const HERO_STACK = ['Vue', 'Nuxt', 'Svelte', 'TypeScript', 'Node.js', 'Go', 'Three.js']

const featured = featuredProjects()
const { getLessonById } = useLessons()
// A hand-picked four for the home page, strongest first; the full list lives on the lab page.
const HOME_LESSON_IDS = ['50', '24', '16', '11']

// Phones: the lab row is a keen-slider (inertia, vertical swipes left to the page, first
// tile on the page padding). The wrapper bleeds to the screen edges and clips; the row
// itself keeps the content width (keen-slider's CSS sets width: 100%, hence !w-auto next
// to mx-6) so the next tile peeks in from the right.
const labSliderRef = ref<HTMLElement | null>(null)
const { isActive: isLabSliderActive } = useMobileSlider(labSliderRef, {
  mode: 'free',
  dragSpeed: 0.9,
  slides: { perView: 1.25, spacing: 16 },
})
const lessons = HOME_LESSON_IDS
  .map(id => getLessonById(id))
  .filter((lesson): lesson is Lesson => Boolean(lesson))

usePageSeo({
  title: 'Alex Buki - Software Engineer',
  // The visible title has no full stop; the meta description needs one between sentences.
  description: [`${t('hero.title')}.`, t('hero.subtitle'), t('hero.now', { studio: 'Vide Infra' })].join(' '),
})
</script>
