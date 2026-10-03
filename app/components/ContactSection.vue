<template>
  <section id="contact" class="scroll-mt-20">
    <h2 class="whitespace-pre-line font-serif text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">{{ $t('contact.title') }}</h2>
    <p class="mt-6 max-w-[60ch] leading-relaxed text-ink-soft">{{ $t('contact.text') }}</p>
    <ul class="mt-8 flex flex-wrap gap-3 sm:gap-4">
      <li v-for="item in items" :key="item.href">
        <a
          :href="item.href"
          data-goal="contact"
          :data-goal-channel="item.channel"
          :target="item.external ? '_blank' : undefined"
          :rel="item.external ? 'noopener noreferrer' : undefined"
          :aria-label="`${item.label}: ${item.value}`"
          :title="item.value"
          class="group relative grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-line bg-surface text-ink transition-[border-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
        >
          <span
            class="absolute inset-0 translate-y-full bg-ink transition-transform duration-300 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0 motion-reduce:transition-none"
            aria-hidden="true"
          />
          <span class="relative h-6 w-6 overflow-hidden" aria-hidden="true">
            <svg
              v-for="copy in ICON_COPIES"
              :key="copy"
              viewBox="0 0 24 24"
              class="absolute inset-0 h-6 w-6 fill-current transition-transform duration-300 ease-out motion-reduce:transition-none"
              :class="copy === 'out'
                ? 'group-hover:-translate-y-full group-focus-visible:-translate-y-full'
                : 'translate-y-full text-paper group-hover:translate-y-0 group-focus-visible:translate-y-0'"
            >
              <path :d="item.icon" />
            </svg>
          </span>
        </a>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { contacts } from '@/data/profile'

// The closing call to action: a display-size title, larger than the other section
// titles on purpose, so the page ends on it. Line breaks come from the copy (\n).
const { t } = useI18n()

/**
 * Icons, all on a 24x24 grid. GitHub and LinkedIn are from Simple Icons (CC0);
 * LinkedIn keeps only the "in" letters, and Telegram only the plane, because
 * their own rounded tiles would sit as a shape inside our round buttons. Email is
 * the filled "mail" glyph from Material Symbols (Apache 2.0), so all four carry
 * the same visual weight.
 */
const ICONS = {
  email: 'M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.587 1.413T20 20zm8-7 8-5V6l-8 5-8-5v2z',
  telegram: 'M21.9 4.3 18.6 19.8c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6 13.3l-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6L20.5 2.8c.9-.3 1.7.2 1.4 1.5Z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z',
  github: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
}

// Hover rolls the icon: the ink copy slides up and out while a paper copy rises
// in with the ink fill behind it.
const ICON_COPIES = ['out', 'in'] as const

const items = computed(() => [
  { channel: 'telegram', label: t('contact.telegram'), value: contacts.telegramHandle, href: contacts.telegram, external: true, icon: ICONS.telegram },
  { channel: 'email', label: t('contact.email'), value: contacts.email, href: `mailto:${contacts.email}`, external: false, icon: ICONS.email },
  { channel: 'linkedin', label: t('contact.linkedin'), value: 'aleksandr-buki', href: contacts.linkedin, external: true, icon: ICONS.linkedin },
  { channel: 'github', label: t('contact.github'), value: contacts.githubHandle, href: contacts.github, external: true, icon: ICONS.github },
])
</script>
