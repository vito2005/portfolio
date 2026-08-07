<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-paper">
    <header class="border-b border-gray-200">
      <nav class="container mx-auto flex items-center justify-between px-6 py-5">
        <NuxtLink to="/" class="font-serif italic text-xl text-gray-900 tracking-tight">
          Playables
        </NuxtLink>
        <ul class="flex items-center gap-6">
          <li>
            <a
              href="https://abuki.dev"
              class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Portfolio
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/in/aleksandr-buki"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              LinkedIn
            </a>
          </li>
        </ul>
      </nav>
    </header>

    <main class="flex-1 container mx-auto px-6 py-12">
      <slot />
    </main>

    <footer class="border-t border-gray-200">
      <div class="container mx-auto px-6 py-4 flex justify-between items-center">
        <p class="text-xs text-gray-400">© {{ year }} Alex Buki</p>
        <a
          href="https://abuki.dev"
          class="text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          abuki.dev
        </a>
      </div>
    </footer>
  </div>
</template>
