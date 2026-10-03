<template>
  <footer class="border-t border-line">
    <div
      class="page flex flex-col gap-4 text-sm text-ink-mute sm:flex-row sm:items-center sm:justify-between"
      :class="compact ? 'py-3' : 'py-8'"
    >
      <p>
        © {{ year }} Alex Buki. Built with Nuxt and Three.js.
        <a
          href="https://sketchfab.com/3d-models/macbook-laptop-7ceb46a1425b475fa7f6bf192e01ed74"
          target="_blank"
          rel="noopener noreferrer"
          class="transition-colors hover:text-ink"
        >Laptop model by Issac Ghazanfar, CC BY 4.0.</a>
      </p>
      <ul v-if="!route.meta.hasContactSection" class="flex-wrap gap-x-6 gap-y-2" :class="compact ? 'hidden sm:flex' : 'flex'">
        <li><a :href="contacts.telegram" data-goal="contact" data-goal-channel="telegram" target="_blank" rel="noopener noreferrer" class="transition-colors hover:text-ink">Telegram</a></li>
        <li><a :href="`mailto:${contacts.email}`" data-goal="contact" data-goal-channel="email" class="transition-colors hover:text-ink">{{ $t('contact.email') }}</a></li>
        <li><a :href="contacts.linkedin" data-goal="contact" data-goal-channel="linkedin" target="_blank" rel="noopener noreferrer" class="transition-colors hover:text-ink">LinkedIn</a></li>
        <li><a :href="contacts.github" data-goal="contact" data-goal-channel="github" target="_blank" rel="noopener noreferrer" class="transition-colors hover:text-ink">GitHub</a></li>
      </ul>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { contacts } from '@/data/profile'

/**
 * compact: one short line for the full-screen Lab shell, where every pixel of
 * height goes to the canvas; phones drop the contact links there.
 */
const { compact = false } = defineProps<{ compact?: boolean }>()

// Pages that end with ContactSection set `hasContactSection` in their page meta;
// there the same four links sit right above, so the footer leaves them out.
const route = useRoute()

// The sign-off stays in English on both locales, like the brand name. The laptop
// credit is required by the model's CC BY 4.0 licence wherever it is shown.
const year = new Date().getFullYear()
</script>
