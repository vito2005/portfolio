<template>
      <div
        class="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer bg-white"
        @click="handleClick"
      >
        <div class="flex items-center justify-between mb-4">
          <span
            class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold"
          >
            Lesson {{ lesson.order }}
          </span>
          <span
            v-if="lesson.type === 'threejs'"
            class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
          >
            Three.js
          </span>
        </div>
        <h2 class="text-xl font-semibold mb-2">{{ lesson.title }}</h2>
        <p class="text-gray-600 text-sm">{{ lesson.description }}</p>
      </div>
</template>

<script setup>
const emit = defineEmits(['click']);
const { lesson } = defineProps({
  lesson: {
    type: Object,
    required: true,
  },
});


const handleClick = () => {
  emit('click', lesson);
};

</script>

<style scoped>
.thumb {
  @apply h-48 object-cover rounded-lg max-w-[70%] mx-auto;
}
</style>
