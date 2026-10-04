<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-3 opacity-0"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="translate-y-3 opacity-0"
  >
    <div
      v-if="isVisible"
      role="region"
      :aria-label="$t('legal.privacy')"
      class="fixed inset-x-4 bottom-4 z-50 rounded-xl border border-line bg-surface p-4 text-sm text-ink-soft shadow-lg sm:inset-x-auto sm:right-6 sm:max-w-sm"
    >
      <p class="leading-relaxed">
        {{ $t('legal.cookie_text') }}
        <NuxtLink :to="localePath('/privacy')" class="link text-ink">{{ $t('legal.cookie_more') }}</NuxtLink>
      </p>
      <button type="button" class="btn mt-3 px-4 py-2 text-sm" @click="handleDismiss">
        {{ $t('legal.cookie_ok') }}
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

/**
 * A one-time notice that the site uses cookies and Yandex Metrica (Webvisor
 * records sessions), with a link to the privacy policy. It renders only on the
 * client, after reading whether it was dismissed, so SSR and hydration agree.
 * The flag lives in localStorage; if storage is blocked the notice simply shows
 * again next visit.
 */
const STORAGE_KEY = 'abuki-cookie-notice'

const localePath = useLocalePath()
const isVisible = ref(false)

onMounted(() => {
  try {
    isVisible.value = localStorage.getItem(STORAGE_KEY) !== 'dismissed'
  }
  catch {
    isVisible.value = true
  }
})

function handleDismiss() {
  isVisible.value = false
  try {
    localStorage.setItem(STORAGE_KEY, 'dismissed')
  }
  catch {
    // Private mode or blocked storage: the notice returns next visit, which is fine.
  }
}
</script>
