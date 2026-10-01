<template>
  <div ref="rootRef" class="relative overflow-hidden">
    <img
      :src="src"
      :srcset="srcset"
      :sizes="sizes"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : undefined"
      decoding="async"
      class="h-full w-full object-cover"
      :class="imgPosition"
    >
    <video
      v-if="video && canPlay"
      ref="videoRef"
      class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
      :class="[imgPosition, isPlaying ? 'opacity-100' : 'opacity-0']"
      muted
      loop
      playsinline
      preload="none"
      aria-hidden="true"
      @playing="isPlaying = true"
    >
      <source :src="`${video}.webm`" type="video/webm">
      <source :src="`${video}.mp4`" type="video/mp4">
    </video>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

/**
 * A cover image that turns into a short looping clip for 3D work, where a still
 * frame undersells the piece. The image is the real content (SEO, no-JS, reduced
 * motion); the clip is fetched only once the card scrolls into view, plays while
 * visible, pauses off screen, and fades in on its first frame so there is never
 * a black flash. Clips ship as `<video>.webm` with an `.mp4` fallback.
 */
const {
  srcset = undefined,
  sizes = undefined,
  video = undefined,
  eager = false,
  imgPosition = 'object-center',
} = defineProps<{
  src: string
  alt: string
  width: number
  height: number
  srcset?: string
  sizes?: string
  /** Path without extension, e.g. `/videos/hemi`. */
  video?: string
  /** Above the fold: load the image eagerly with high priority. */
  eager?: boolean
  /** object-position utility shared by the image and the clip. */
  imgPosition?: string
}>()

const rootRef = ref<HTMLDivElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const canPlay = ref(false)
const isPlaying = ref(false)

let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!video || !rootRef.value) {
    return
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }
  canPlay.value = true

  observer = new IntersectionObserver(([entry]) => {
    const element = videoRef.value
    if (!element) {
      return
    }
    if (entry?.isIntersecting) {
      // Autoplay can still be refused (data saver, low power); the image stays then.
      element.play().catch(() => {})
    }
    else {
      element.pause()
    }
  }, { threshold: 0.25 })
  observer.observe(rootRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>
