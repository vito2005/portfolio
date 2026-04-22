<template>
  <section class="flex flex-col-reverse sm:flex-row items-center sm:items-start gap-12 pt-4 sm:pt-12">
    <div class="flex-1 sm:pt-6">
      <p class="text-xs font-semibold text-[#12b488] tracking-[0.2em] uppercase mb-4">3D Web Engineer</p>
      <h1 class="font-serif text-5xl sm:text-6xl leading-[1.1] text-gray-900 mb-6">Alex Buki</h1>
      <p class="text-gray-500 leading-relaxed max-w-sm mb-8 min-h-[5rem]">{{ descriptionText }}</p>
      <div
        class="flex flex-wrap gap-3 transition-opacity duration-700"
        :class="showLinks ? 'opacity-100' : 'opacity-0'"
      >
        <NuxtLink to="/lessons" class="btn">View examples</NuxtLink>
        <a
          href="https://www.linkedin.com/in/aleksandr-buki"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-outline"
        >LinkedIn ↗</a>
      </div>
    </div>
    <div class="flex-shrink-0">
      <Avatar @loaded="onAvatarLoaded" />
    </div>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const url = useRequestURL()
const canonicalUrl = url.origin + route.path

const seoTitle = 'Alex Buki — 3D Web Engineer'
const seoDescription =
  'Senior Frontend Engineer specializing in interactive 3D scenes, shaders, and animations for the web.'

useHead({
  title: seoTitle,
  meta: [
    { name: 'description', content: seoDescription },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: seoTitle },
    { property: 'og:description', content: seoDescription },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:image', content: url.origin + '/og-image.png' },
    { property: 'og:site_name', content: 'Alex Buki' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: seoTitle },
    { name: 'twitter:description', content: seoDescription },
  ],
  link: [{ rel: 'canonical', href: canonicalUrl }],
})

const { typeText } = useTypewriter()

const descriptionText = ref('')
const showLinks = ref(false)

async function onAvatarLoaded() {
  await typeText(
    'Senior Frontend Engineer specializing in interactive 3D scenes and animations for the web using Three.js.',
    descriptionText
  )
  showLinks.value = true
}
</script>
