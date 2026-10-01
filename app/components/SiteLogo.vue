<template>
  <!--
    "A.B." geometric monogram, variant 01 of the logo study: a long diagonal A
    sharing its vertical stem with a compact B. The A's counter is cut out of the
    letters and filled with the accent triangle. The viewBox is cropped to the
    mark's outline, so `size` is the visible height.
  -->
  <svg viewBox="28 16 194 99" :height="size" :width="size * 194 / 99" fill="none" aria-hidden="true">
    <path
      d="M28 111 L55 111 L117 44 L118 115 L196 115 L203 113 L216 103 L222 88 L221 77 L218 71 L212 64 L204 59 L207 56 L210 47 L208 32 L200 22 L187 16 L114 16 L28 111 Z M140 36 L185 36 L190 44 L185 53 L181 55 L153 55 L153 73 L195 74 L199 77 L202 83 L200 91 L193 96 L141 96 Z M105.5 72.5 L75 105.5 L105.5 105.5 Z"
      fill="currentColor"
      fill-rule="evenodd"
    />
    <path d="M105.5 72.5 L75 105.5 H105.5 Z" class="fill-accent transition-colors group-hover:fill-ink" />
  </svg>
</template>

<script setup lang="ts">
// Inside a `group` link (the header's home link) the colours swap on hover:
// the letters take the link's green, the triangle turns ink.

/** Height in px; width follows the mark's 194:99 proportions. */
const { size = 20 } = defineProps<{ size?: number }>()
</script>
