<template>
  <div
    class="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-[#12b488] hover:shadow-sm transition-all duration-200 group"
    @click="handleClick"
  >
    <div class="flex items-start justify-between mb-5">
      <span class="text-xs font-semibold text-[#12b488] tracking-widest uppercase">
        Ex. {{ lesson.order }}
      </span>
      <span class="text-[10px] font-medium text-gray-400 tracking-wider uppercase bg-gray-100 px-2 py-1 rounded">
        Three.js
      </span>
    </div>
    <h2 class="font-serif text-xl mb-2 group-hover:text-[#12b488] transition-colors">{{ lesson.title }}</h2>
    <p class="text-gray-500 text-sm leading-relaxed">{{ lesson.description }}</p>
  </div>
</template>

<script setup>
const emit = defineEmits(['click'])
const { lesson } = defineProps({
  lesson: {
    type: Object,
    required: true,
  },
})

const handleClick = () => {
  emit('click', lesson)
}
</script>
