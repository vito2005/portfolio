<script setup>
const year = new Date().getFullYear();
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b shadow-sm bg-white max-h-[75px]">
      <nav class="container mx-auto flex items-center justify-between p-4 py-6 ">
        <NuxtLink to="/" class="text-xl font-semibold">A.B.</NuxtLink>
        <ul class="flex gap-4">
          <!-- <li>
            <NuxtLink to="/about" class="hover:shadow-sm rounded-md p-2"
              >About</NuxtLink
            >
          </li> -->
          <li>
            <NuxtLink to="/lessons" class="btn">Examples</NuxtLink>
          </li>
        </ul>
      </nav>
    </header>
    <main class="flex-1 container mx-auto p-4">
      <slot />
    </main>
    <footer class="border-t flex justify-between items-center">
      <p class="p-4 text-sm text-gray-500">Copyright {{ year }}</p>
      <PoweredBy />
    </footer>
  </div>
</template>
