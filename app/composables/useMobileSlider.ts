import type { KeenSliderInstance, KeenSliderOptions } from 'keen-slider'
import { nextTick, onMounted, onUnmounted, ref, shallowRef, type Ref } from 'vue'

/** Phones only: from Tailwind's `sm` up the row is a plain grid. */
const MOBILE_QUERY = '(max-width: 639px)'

/**
 * Turns a row of cards into a keen-slider on phones: swipes keep going by inertia,
 * vertical swipes stay with the page (keen-slider sets touch-action: pan-y), and the
 * first card sits on the page padding instead of snapping to the screen edge the
 * way a native scroll-snap row does.
 *
 * The library and its CSS load only when the slider is needed. Until then (SSR,
 * first paint, wider screens) the markup renders whatever fallback the page gives
 * it; `isActive` says when to switch the container and slides to keen-slider classes.
 * Same loading pattern as usePhotoSlider in sea-breeze-booking.
 *
 * @param containerRef - The row element; its children become the slides
 * @param options - keen-slider options for the phone layout
 * @returns `isActive`: true while keen-slider runs the row
 */
export function useMobileSlider(containerRef: Ref<HTMLElement | null>, options: KeenSliderOptions = {}) {
  const isActive = ref(false)
  const slider = shallowRef<KeenSliderInstance | null>(null)
  let query: MediaQueryList | null = null

  async function createSlider() {
    if (!containerRef.value || slider.value) {
      return
    }
    const [{ default: KeenSlider }] = await Promise.all([
      import('keen-slider'),
      import('keen-slider/keen-slider.min.css'),
    ])
    // The breakpoint can change while the chunk loads.
    if (!query?.matches || slider.value || !containerRef.value) {
      return
    }
    // Swap to the slider classes first, so keen-slider measures the final layout.
    isActive.value = true
    await nextTick()
    slider.value = new KeenSlider(containerRef.value, {
      selector: (container: HTMLElement) => Array.from(container.children) as HTMLElement[],
      ...options,
    })
  }

  function destroySlider() {
    slider.value?.destroy()
    slider.value = null
    isActive.value = false
  }

  function handleBreakpointChange() {
    if (query?.matches) {
      createSlider()
    }
    else {
      destroySlider()
    }
  }

  onMounted(() => {
    query = window.matchMedia(MOBILE_QUERY)
    query.addEventListener('change', handleBreakpointChange)
    handleBreakpointChange()
  })

  onUnmounted(() => {
    query?.removeEventListener('change', handleBreakpointChange)
    destroySlider()
  })

  return { isActive }
}
