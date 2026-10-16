<template>
  <a
    :href="pick(cvFile)"
    download
    data-goal="cv_download"
    :data-goal-place="place"
    class="link group relative inline-flex items-center gap-1.5 text-sm text-ink"
  >
    {{ $t('home.cv_download') }}
    <span class="relative h-3.5 w-3.5 flex-none" aria-hidden="true">
      <svg viewBox="0 -960 960 960" class="absolute inset-0 h-full w-full fill-current">
        <path :d="TRAY_ICON" />
      </svg>
      <svg
        viewBox="0 -960 960 960"
        class="absolute inset-0 h-full w-full fill-current transition-transform duration-300 ease-out group-focus-visible:translate-y-[2px] motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-y-[2px]"
      >
        <path :d="ARROW_ICON" />
      </svg>
    </span>
    <span
      class="pointer-events-none absolute bottom-full z-10 mb-3 w-28 origin-bottom translate-y-3 rotate-[-7deg] opacity-0 transition duration-300 ease-out group-focus-visible:translate-y-0 group-focus-visible:rotate-[-3deg] group-focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:rotate-[-3deg] [@media(hover:hover)]:group-hover:opacity-100"
      :class="align === 'end' ? 'right-0' : 'left-0'"
      aria-hidden="true"
    >
      <img
        :src="pick(cvPreview)"
        alt=""
        width="360"
        height="510"
        loading="lazy"
        decoding="async"
        class="block w-full rounded-[2px] bg-surface shadow-[0_1px_2px_rgba(24,18,12,0.08),0_14px_26px_-12px_rgba(24,18,12,0.3)]"
      >
    </span>
  </a>
</template>

<script setup lang="ts">
import { cvFile, cvPreview } from '@/data/profile'

/**
 * Download link for the one-page CV. On hover (pointer devices only, a tap would
 * leave it stuck) and on keyboard focus, the first page peeks out above the link
 * like a sheet of paper, so a recruiter sees it is one page before clicking.
 * `place` tags the Metrika goal; `align` keeps the sheet inside the column.
 */
const { place, align = 'start' } = defineProps<{
  place: string
  align?: 'start' | 'end'
}>()

const { pick } = useLocalized()

/**
 * The "download" glyph from Material Symbols (Apache 2.0), the same set as the
 * mail icon in ContactSection, split in two so only the arrow dips on hover
 * while the tray stays put.
 */
const ARROW_ICON = 'M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200Z'
const TRAY_ICON = 'M240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z'
</script>
