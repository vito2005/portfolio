<template>
  <div>
    <h2 class="text-2xl font-semibold">{{ headerText }}</h2>
    <p class="text-gray-600">{{ descriptionText }}</p>
    <p class="text-gray-600">
      {{ lessonsTextBefore }} 
      <NuxtLink to="/lessons" class="text-blue-500 hover:underline">{{ lessonsLinkText }}</NuxtLink>
      {{ lessonsTextAfter }}
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

useHead({
  title: "Alex Buki - Software Engineer",
  meta: [{ name: "description", content: "Alex Buki Software Engineer" }],
});

const { typeText } = useTypewriter()

const headerText = ref('')
const descriptionText = ref('')
const lessonsTextBefore = ref('')
const lessonsLinkText = ref('')
const lessonsTextAfter = ref('')

const texts = [
  { text: "Hello, I'm Alex Buki", ref: headerText },
  { text: "I'm currently learning WebGL technology and some 3D graphics libraries like Three.js.", ref: descriptionText },
  { text: "There are some ", ref: lessonsTextBefore },
  { text: "lessons", ref: lessonsLinkText },
  { text: " I've passed while learning these technologies.", ref: lessonsTextAfter },
]

onMounted(async () => {
  for (const { text, ref } of texts) {
    await typeText(text, ref)
  }
})
</script>

