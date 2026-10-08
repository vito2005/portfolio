<template>
  <div>
    <div
      ref="rootRef"
      class="relative -mx-6 select-none overflow-hidden sm:mx-0"
      :class="isReady ? 'touch-pan-y' : ''"
      :style="isReady ? { height: `${layout.height}px`, cursor: isDragging ? 'grabbing' : 'grab', ...edgeFade } : undefined"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @pointerenter="isHovered = true"
      @pointerleave="handlePointerLeave"
      @click.capture="handleClickCapture"
      @dragstart.prevent
      @focusin="handleFocusIn"
    >
      <svg
        v-if="isReady"
        class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <path :d="ropeData" fill="none" stroke="rgba(17,17,17,0.08)" stroke-width="3" stroke-linecap="round" transform="translate(0 5)" />
        <path :d="ropeData" fill="none" class="stroke-ink-mute" stroke-width="1.6" stroke-linecap="round" />
        <path :d="ropeData" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.7" stroke-dasharray="2.2 2.8" />
      </svg>

      <ul
        :class="isReady ? 'absolute inset-0' : 'flex snap-x gap-6 overflow-x-auto px-6 pb-6 pt-8 sm:px-0'"
        :aria-label="$t('home.projects_title')"
      >
        <li
          v-for="slot in slots"
          :key="slot.key"
          :ref="element => setCardRef(element, slot.index)"
          :inert="slot.isCopy || undefined"
          :aria-hidden="slot.isCopy || undefined"
          :class="isReady ? 'absolute left-0 top-0 origin-top will-change-transform' : 'relative flex-none snap-start'"
          :style="{ width: `${layout.cardWidth}px` }"
          @pointerenter="nudgeCard(slot.index)"
        >
          <NuxtLink
            :to="localePath(`/projects/${slot.project.slug}`)"
            :tabindex="slot.isCopy ? -1 : undefined"
            draggable="false"
            data-goal="project_open"
            :data-goal-slug="slot.project.slug"
            class="group block rounded-[3px] bg-surface p-2.5 shadow-[0_1px_2px_rgba(24,18,12,0.07),0_14px_26px_-14px_rgba(24,18,12,0.28),0_34px_60px_-34px_rgba(24,18,12,0.3)] transition-shadow hover:shadow-[0_1px_2px_rgba(24,18,12,0.08),0_18px_32px_-14px_rgba(24,18,12,0.34),0_40px_70px_-34px_rgba(24,18,12,0.36)]"
          >
            <div class="relative overflow-hidden rounded-[2px]">
              <PreviewMedia
                :src="pick(slot.project.cover)"
                :srcset="`${smallCover(slot.project)} 800w, ${pick(slot.project.cover)} 1440w`"
                :sizes="`${layout.cardWidth}px`"
                :alt="pick(slot.project.coverAlt)"
                :width="1440"
                :height="720"
                :video="slot.project.video"
                :lazy="false"
                img-position="object-top"
                class="pointer-events-none aspect-[4/3] w-full bg-paper-deep"
              />
              <p
                class="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-ink/80 via-ink/55 to-transparent px-3 pb-3 pt-10 text-[0.8rem] leading-snug text-surface opacity-0 transition duration-300 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
              >
                {{ pick(slot.project.tagline) }}
              </p>
            </div>
            <div class="px-1 pb-1.5 pt-3">
              <p class="font-serif text-xl leading-tight tracking-tight text-ink transition-colors [@media(hover:hover)]:group-hover:text-accent-deep">
                {{ slot.project.title }}
              </p>
              <p class="mt-1 flex justify-between gap-3 text-xs text-ink-mute">
                <span class="truncate">{{ slot.project.company ?? $t(projectOriginKey(slot.project)) }}</span>
                <span v-if="slot.project.period" class="flex-none">{{ pick(slot.project.period) }}</span>
              </p>
            </div>
          </NuxtLink>

          <span
            v-if="isReady"
            class="pointer-events-none absolute -top-5 left-1/2 h-10 w-3 -translate-x-1/2 rounded-[3px] bg-accent shadow-[0_2px_3px_rgba(17,17,17,0.18)]"
            aria-hidden="true"
          >
            <span class="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-accent-deep" />
            <span class="absolute -inset-x-0.5 top-[38%] h-1 rounded-full bg-ink-mute/60" />
          </span>
        </li>
      </ul>
    </div>
    <p v-if="isReady" class="mt-2 text-center text-xs text-ink-mute">{{ $t('home.projects_drag_hint') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import type { Project } from '@/data/types'
import { projectOriginKey } from '@/data/projects'
import {
  createLineState,
  createRope,
  hash01,
  ropePathData,
  slotX,
  stepLine,
  type LinePath,
  type LineState,
} from '@/composables/clothesline/clothesline'

/**
 * The featured projects as photo prints pegged to a rope across the page. The
 * line drifts slowly, can be dragged or thrown sideways and loops forever; each
 * print swings on its peg when the line jerks. Without JS (and during SSR) the
 * same cards render as a plain scrollable row, so links and text are always there.
 *
 * Template notes (kept here: HTML comments in templates have caused hydration
 * mismatches in this project):
 * - the rope is three strokes: a soft shadow under it, the cord, and a dashed
 *   highlight that reads as braid;
 * - the tagline slides over the photo on hover and keyboard focus, but not on
 *   touch, where hover sticks after a tap;
 * - the clothespin is two jaws in the accent colour with a steel spring.
 */
const { projects } = defineProps<{ projects: Project[] }>()

const localePath = useLocalePath()
const { pick } = useLocalized()

const smallCover = (project: Project) => pick(project.cover).replace(/\.webp$/, '-800.webp')

const rootRef = ref<HTMLDivElement | null>(null)
const isReady = ref(false)
const isDragging = ref(false)
const isHovered = ref(false)

/** Container width; 0 until measured on the client. */
const width = ref(0)

const layout = computed(() => {
  const containerWidth = width.value
  const isNarrow = containerWidth > 0 && containerWidth < 640
  // A print is a quarter of the line on desktop and most of the screen on a phone.
  const cardWidth = containerWidth === 0
    ? 300
    : Math.round(isNarrow ? Math.min(containerWidth * 0.68, 280) : Math.min(Math.max(containerWidth * 0.24, 240), 320))
  const gap = isNarrow ? 28 : 44
  const step = cardWidth + gap
  // Photo is 4:3 inside a 10px border, plus the caption strip under it.
  const cardHeight = 20 + (cardWidth - 20) * 0.75 + 66
  const sag = Math.round(Math.min(Math.max(containerWidth * 0.035, 22), 52))
  const top = 34
  return {
    cardWidth,
    step,
    sag,
    top,
    // Rope, the drop of the lowest print, and room below for its swing and shadow.
    height: Math.round(top + sag + cardHeight + 36),
  }
})

/**
 * Enough copies of the projects to cover the line plus two prints of margin on
 * each side, so the loop seam always happens out of sight.
 */
const slotCount = computed(() => {
  const count = projects.length
  if (!isReady.value || count === 0) {
    return count
  }
  return count * Math.max(1, Math.ceil((width.value + layout.value.step * 4) / (count * layout.value.step)))
})

const slots = computed(() => Array.from({ length: slotCount.value }, (_, index) => {
  const project = projects[index % projects.length] as Project
  return { key: `${project.slug}-${index}`, index, project, isCopy: index >= projects.length }
}))

let rope: LinePath = createRope({ width: 1, top: 0, sag: 0 })
const ropeData = ref('')

/** Fade the line out at both edges so cards dissolve instead of being cut. */
const edgeFade = computed(() => {
  const fade = width.value < 640 ? 24 : 72
  const mask = `linear-gradient(90deg, transparent 0, #000 ${fade}px, #000 calc(100% - ${fade}px), transparent 100%)`
  return { maskImage: mask, WebkitMaskImage: mask }
})

/** Animation state lives outside Vue reactivity: it changes every frame. */
let state: LineState = createLineState(0)
const cardElements: (HTMLElement | null)[] = []
let animationId = 0
let lastFrameTime = 0
let isVisible = false
let hasIntroSwing = false
let reducedMotion = false
/** Distance still to travel to bring a keyboard-focused card into view. */
let pendingShift = 0

// Pointer bookkeeping for drags and throws.
let pointerId = -1
let lastPointerX = 0
let lastPointerTime = 0
let dragDistance = 0
let suppressClick = false

/** Drift to the left at a walking pace for the eye; pauses under the cursor. */
const DRIFT_SPEED = -16
const DRAG_THRESHOLD = 6

function setCardRef(element: unknown, index: number) {
  cardElements[index] = element instanceof HTMLElement ? element : null
}

function paint() {
  const { cardWidth, step } = layout.value
  const count = slotCount.value
  // The whole line leans a little with speed, like wet laundry in the wind.
  const lean = Math.max(-6, Math.min(6, state.smoothVelocity * 0.004 * (reducedMotion ? 0 : 1)))
  for (let index = 0; index < count; index++) {
    const element = cardElements[index]
    if (!element) {
      continue
    }
    const x = slotX(index, step, count, state.position, width.value)
    // Each print keeps its own small random tilt; copies share their original's.
    const jitter = (hash01((index % projects.length) + 1) * 2 - 1) * 2.2
    const angle = rope.tilt(x) * 0.8 + jitter + (state.swing[index] ?? 0) + lean
    // The peg grips the print's top edge a few px below the rope.
    const y = rope.y(x) - 6
    element.style.transform = `translate3d(${(x - cardWidth / 2).toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${angle.toFixed(3)}deg)`
  }
}

function tick(time: number) {
  animationId = 0
  if (!isVisible) {
    return
  }
  const dt = Math.min(0.05, Math.max(0.001, (time - lastFrameTime) / 1000))
  lastFrameTime = time

  let moving = stepLine(state, {
    driftSpeed: reducedMotion || isHovered.value ? 0 : DRIFT_SPEED,
    sway: reducedMotion ? 0 : 1,
  }, dt)

  if (Math.abs(pendingShift) > 0.5) {
    const move = pendingShift * (1 - Math.exp(-dt * 8))
    state.position += move
    pendingShift -= move
    moving = true
  }
  else {
    pendingShift = 0
  }

  paint()
  if (moving) {
    animationId = requestAnimationFrame(tick)
  }
}

function wake() {
  if (animationId || !isVisible) {
    return
  }
  lastFrameTime = performance.now()
  animationId = requestAnimationFrame(tick)
}

/** Rebuild the rope for the current size and resize the per-card swing arrays. */
function measure() {
  const element = rootRef.value
  if (!element) {
    return
  }
  width.value = element.clientWidth
  const { top, sag } = layout.value
  rope = createRope({ width: width.value, top, sag })
  ropeData.value = ropePathData(rope, width.value)
  if (state.swing.length !== slotCount.value) {
    const next = createLineState(slotCount.value)
    next.position = state.position
    next.velocity = state.velocity
    next.smoothVelocity = state.smoothVelocity
    state = next
  }
  cardElements.length = slotCount.value
  // Wait for Vue to render the new slot count before positioning them.
  nextTick(() => {
    paint()
    wake()
  })
}

/** Every print gets a little shove the first time the line comes into view. */
function startIntroSwing() {
  if (hasIntroSwing || reducedMotion) {
    return
  }
  hasIntroSwing = true
  for (let index = 0; index < state.spin.length; index++) {
    state.spin[index] = (hash01(index * 3 + 7) > 0.5 ? 1 : -1) * (26 + hash01(index + 19) * 30)
  }
}

function nudgeCard(index: number) {
  if (reducedMotion || isDragging.value || index >= state.spin.length) {
    return
  }
  state.spin[index] = (state.spin[index] ?? 0) + (hash01(index + performance.now()) > 0.5 ? 18 : -18)
  wake()
}

function handlePointerDown(event: PointerEvent) {
  if (!isReady.value || event.button !== 0) {
    return
  }
  pointerId = event.pointerId
  lastPointerX = event.clientX
  lastPointerTime = performance.now()
  dragDistance = 0
  suppressClick = false
  state.dragging = true
  pendingShift = 0
  wake()
}

function handlePointerMove(event: PointerEvent) {
  if (!state.dragging || event.pointerId !== pointerId) {
    return
  }
  const now = performance.now()
  const dx = event.clientX - lastPointerX
  const dt = Math.max(1, now - lastPointerTime) / 1000
  lastPointerX = event.clientX
  lastPointerTime = now
  dragDistance += Math.abs(dx)

  state.position += dx
  // Blend in the newest sample so the throw follows the last flick, not the whole drag.
  state.velocity = state.velocity * 0.6 + Math.max(-2400, Math.min(2400, dx / dt)) * 0.4

  if (dragDistance > DRAG_THRESHOLD && !isDragging.value) {
    // Only now take the pointer: a plain tap must still reach the link.
    isDragging.value = true
    suppressClick = true
    rootRef.value?.setPointerCapture(pointerId)
  }
  wake()
}

function handlePointerUp(event: PointerEvent) {
  if (event.pointerId !== pointerId) {
    return
  }
  state.dragging = false
  isDragging.value = false
  pointerId = -1
  // A finger that stopped before lifting should not throw the line.
  if (performance.now() - lastPointerTime > 80) {
    state.velocity = 0
  }
  wake()
}

function handlePointerLeave(event: PointerEvent) {
  isHovered.value = false
  if (event.pointerType === 'mouse' && !isDragging.value) {
    state.dragging = false
  }
  wake()
}

function handleClickCapture(event: MouseEvent) {
  if (suppressClick) {
    event.preventDefault()
    event.stopPropagation()
    suppressClick = false
  }
}

/** Sideways trackpad swipes move the line; vertical scrolling is left to the page. */
function handleWheel(event: WheelEvent) {
  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
    return
  }
  event.preventDefault()
  state.position -= event.deltaX
  state.velocity = state.velocity * 0.5 + Math.max(-1100, Math.min(1100, -event.deltaX * 11))
  wake()
}

/** Tabbing to a print that hangs near an edge slides it to the middle. */
function handleFocusIn(event: FocusEvent) {
  const index = cardElements.findIndex(element => element?.contains(event.target as Node))
  if (index < 0) {
    return
  }
  const x = slotX(index, layout.value.step, slotCount.value, state.position, width.value)
  if (x < layout.value.step * 0.6 || x > width.value - layout.value.step * 0.6) {
    pendingShift = width.value / 2 - x
    wake()
  }
}

let resizeObserver: ResizeObserver | null = null
let intersectionObserver: IntersectionObserver | null = null

onMounted(() => {
  const element = rootRef.value
  if (!element) {
    return
  }
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  isReady.value = true
  nextTick(measure)

  resizeObserver = new ResizeObserver(() => {
    if (element.clientWidth !== width.value) {
      measure()
    }
  })
  resizeObserver.observe(element)

  // The line sleeps while it is off screen.
  intersectionObserver = new IntersectionObserver(([entry]) => {
    isVisible = Boolean(entry?.isIntersecting)
    if (isVisible) {
      startIntroSwing()
      wake()
    }
  }, { threshold: 0.1 })
  intersectionObserver.observe(element)

  element.addEventListener('wheel', handleWheel, { passive: false })
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  animationId = 0
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  rootRef.value?.removeEventListener('wheel', handleWheel)
})
</script>
