<template>
  <header class="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
    <nav class="page flex h-16 items-center justify-between" :aria-label="$t('nav.menu')">
      <NuxtLink :to="localePath('/')" class="group text-ink transition-colors hover:text-accent-deep" aria-label="Alex Buki, home">
        <SiteLogo :size="24" />
      </NuxtLink>
      <div class="flex items-center gap-4 sm:gap-7">
        <ul class="hidden items-center gap-7 text-sm sm:flex">
          <li v-for="item in links" :key="item.label">
            <NuxtLink
              :to="item.to"
              class="transition-colors hover:text-ink"
              :class="isCurrent(item) ? 'text-ink' : 'text-ink-soft'"
            >
              {{ $t(item.label) }}
            </NuxtLink>
          </li>
        </ul>
        <NuxtLink
          :to="switchLocalePath(otherLocale)"
          data-goal="locale"
          :data-goal-to="otherLocale"
          class="rounded-md border border-line px-2 py-1 text-xs font-medium uppercase text-ink-soft transition-colors hover:border-ink hover:text-ink"
          :aria-label="$t('nav.switch_locale')"
          :title="$t('nav.switch_locale')"
        >
          {{ otherLocale }}
        </NuxtLink>
        <button
          type="button"
          class="-mr-2 grid h-10 w-10 place-items-center rounded-md text-ink sm:hidden"
          :aria-expanded="isMenuOpen"
          aria-controls="mobile-menu"
          :aria-label="isMenuOpen ? $t('nav.menu_close') : $t('nav.menu_open')"
          @click="isMenuOpen = !isMenuOpen"
        >
          <span class="relative block h-3.5 w-5" aria-hidden="true">
            <span
              class="absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition-transform duration-200"
              :class="isMenuOpen ? 'translate-y-[6px] rotate-45' : ''"
            />
            <span
              class="absolute left-0 top-[6px] h-0.5 w-5 rounded-full bg-current transition-opacity duration-150"
              :class="isMenuOpen ? 'opacity-0' : ''"
            />
            <span
              class="absolute bottom-0 left-0 h-0.5 w-5 rounded-full bg-current transition-transform duration-200"
              :class="isMenuOpen ? '-translate-y-[6px] -rotate-45' : ''"
            />
          </span>
        </button>
      </div>
    </nav>
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <div v-if="isMenuOpen" id="mobile-menu" class="absolute inset-x-0 top-full border-y border-line bg-paper shadow-sm sm:hidden">
        <ul class="page flex flex-col py-3">
          <li v-for="item in links" :key="item.label">
            <NuxtLink :to="item.to" class="block py-3 font-serif text-2xl tracking-tight text-ink" @click="isMenuOpen = false">
              {{ $t(item.label) }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { locale } = useI18n()
const route = useRoute()

// Projects and Lab are routes; About and Contact are sections of the home page,
// so they never get the "active" colour (it would light up on the whole home page).
const links = computed(() => [
  { label: 'nav.projects', to: localePath('/projects'), isSection: false },
  { label: 'nav.lab', to: localePath('/lab'), isSection: false },
  { label: 'nav.about', to: `${localePath('/')}#about`, isSection: true },
  { label: 'nav.contact', to: `${localePath('/')}#contact`, isSection: true },
])

// A section lights up on its own pages too: Lab on every experiment, Projects on every
// case study. Those are sibling routes, so the router's active class misses them.
function isCurrent(item: { to: string, isSection: boolean }) {
  return !item.isSection && route.path.startsWith(item.to)
}

// Two locales only, so the switch is a single toggle rather than a menu.
const otherLocale = computed(() => (locale.value === 'en' ? 'ru' : 'en'))

// Below `sm` the links don't fit next to the logo (the Russian ones least of
// all), so they move into a panel under the header behind a menu button. The
// panel overlays the page (absolute) rather than pushing it down: otherwise a
// hash link scrolls with the panel open and lands 200px off once it closes.
const isMenuOpen = ref(false)

// Any navigation, including the hash links to home sections, closes the panel.
watch(() => route.fullPath, () => {
  isMenuOpen.value = false
})

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    isMenuOpen.value = false
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>
