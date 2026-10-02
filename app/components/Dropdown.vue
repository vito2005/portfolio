<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div ref="dropdownRef" class="relative">
    <button
      type="button"
      class="flex items-center gap-2 whitespace-nowrap rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-ink-mute"
      :aria-expanded="isDropdownOpen"
      @click="toggleDropdown">
      <slot name="button" :text="displayText">
        <span>{{ displayText }}</span>
      </slot>
      <svg
        class="w-4 h-4 transition-transform" :class="{ 'rotate-180': isDropdownOpen }" fill="none"
        stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <transition
      enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100" leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100" leave-to-class="transform opacity-0 scale-95">
      <ul
v-if="isDropdownOpen"
        class="absolute right-0 z-50 mt-2 max-h-96 w-60 overflow-y-auto rounded-md border border-line bg-surface py-1 text-sm text-ink shadow-lg">
        <li
v-for="option in options" :key="getOptionId(option)"
          class="cursor-pointer px-4 py-2 transition-colors hover:bg-paper-deep" :class="{
            'bg-paper-deep': isSelected(option),
          }" @click="selectOption(option)">
          <slot name="option" :option="option">
            <div class="flex flex-col">
              <span class="font-medium">{{ getOptionLabel(option) }}</span>
              <span v-if="getOptionSubtitle(option)" class="text-xs text-ink-mute">
                {{ getOptionSubtitle(option) }}
              </span>
            </div>
          </slot>
        </li>
      </ul>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  options: {
    type: Array,
    required: true,
  },
  selectedValue: {
    type: [String, Number, Object],
    default: null,
  },
  placeholder: {
    type: String,
    default: 'Select option',
  },
  labelKey: {
    type: String,
    default: 'title',
  },
  valueKey: {
    type: String,
    default: 'id',
  },
  subtitleKey: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:selectedValue', 'select'])

const isDropdownOpen = ref(false)
const dropdownRef = ref(null)

const selectedOption = computed(() => {
  if (!props.selectedValue) return null

  if (typeof props.selectedValue === 'object') {
    return props.selectedValue
  }

  return props.options.find(option => {
    const optionValue = typeof option === 'object'
      ? option[props.valueKey]
      : option
    return optionValue === props.selectedValue
  })
})

const displayText = computed(() => {
  if (selectedOption.value) {
    return getOptionLabel(selectedOption.value)
  }
  return props.placeholder
})

const getOptionId = (option) => {
  if (typeof option === 'object') {
    return option[props.valueKey] || JSON.stringify(option)
  }
  return option
}

const getOptionLabel = (option) => {
  if (typeof option === 'object') {
    return option[props.labelKey] || String(option)
  }
  return String(option)
}

const getOptionSubtitle = (option) => {
  if (!props.subtitleKey) return null
  if (typeof option === 'object') {
    return option[props.subtitleKey] || null
  }
  return null
}

const isSelected = (option) => {
  if (!selectedOption.value) return false

  const optionValue = typeof option === 'object'
    ? option[props.valueKey]
    : option

  if (typeof props.selectedValue === 'object') {
    return props.selectedValue === option
  }

  return optionValue === props.selectedValue
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const selectOption = (option) => {
  const value = typeof option === 'object' ? option[props.valueKey] : option
  emit('update:selectedValue', value)
  emit('select', option)
  isDropdownOpen.value = false
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped></style>
