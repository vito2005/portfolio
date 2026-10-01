<template>
  <header class="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
    <nav class="page flex h-16 items-center justify-between" :aria-label="$t('nav.menu')">
      <NuxtLink :to="localePath('/')" class="group text-ink transition-colors hover:text-accent-deep" aria-label="Alex Buki, home">
        <SiteLogo :size="24" />
      </NuxtLink>
      <ul class="flex items-center gap-4 text-sm sm:gap-7">
        <li v-for="item in navItems" :key="item.to">
          <NuxtLink
            :to="localePath(item.to)"
            class="text-ink-soft transition-colors hover:text-ink"
            active-class="text-ink"
          >
            {{ $t(item.label) }}
          </NuxtLink>
        </li>
        <li v-for="item in homeSections" :key="item.hash">
          <NuxtLink :to="localePath('/') + item.hash" class="text-ink-soft transition-colors hover:text-ink">
            {{ $t(item.label) }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            :to="switchLocalePath(otherLocale)"
            class="rounded-md border border-line px-2 py-1 text-xs font-medium uppercase text-ink-soft transition-colors hover:border-ink hover:text-ink"
            :aria-label="$t('nav.switch_locale')"
            :title="$t('nav.switch_locale')"
          >
            {{ otherLocale }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { locale } = useI18n()

const navItems = [
  { label: 'nav.projects', to: '/projects' },
  { label: 'nav.lab', to: '/lessons' },
]

// About and Contact are sections of the home page, not routes of their own.
const homeSections = [
  { label: 'nav.about', hash: '#about' },
  { label: 'nav.contact', hash: '#contact' },
]

// Two locales only, so the switch is a single toggle rather than a menu.
const otherLocale = computed(() => (locale.value === 'en' ? 'ru' : 'en'))
</script>
