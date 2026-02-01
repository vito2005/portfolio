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

const route = useRoute()
const url = useRequestURL()
const canonicalUrl = url.origin + route.path

const seoTitle = 'Alex Buki — Software Engineer'
const seoDescription =
  "I'm learning WebGL and 3D graphics with Three.js. Here are the lessons I've completed along the way."

useHead({
  title: seoTitle,
  meta: [
    { name: 'description', content: seoDescription },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: seoTitle },
    { property: 'og:description', content: seoDescription },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:site_name', content: 'Alex Buki Developer' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: seoTitle },
    { name: 'twitter:description', content: seoDescription },
  ],
  link: [{ rel: 'canonical', href: canonicalUrl }],
})

const { typeText } = useTypewriter()

const headerText = ref('')
const descriptionText = ref('')
const lessonsTextBefore = ref('')
const lessonsLinkText = ref('')
const lessonsTextAfter = ref('')

const texts = [
  { text: "Hello, I'm Alex Buki - a software engineer.", ref: headerText },
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
