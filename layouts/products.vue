<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b shadow-sm bg-white">
      <nav class="container mx-auto p-4">
        <NuxtLink to="/products" class="text-xl font-semibold"
          >Products</NuxtLink
        >
      </nav>
    </header>
    <main class="flex-1 container mx-auto p-4">
      <slot />
    </main>
    <footer class="border-t">
      <ul class="container mx-auto p-4 flex gap-4 text-sm text-gray-600">
        <li>
          <NuxtLink to="/" class="hover:shadow-sm rounded-md p-2"
            >Home</NuxtLink
          >
        </li>
        <li>
          <NuxtLink to="/about" class="hover:shadow-sm rounded-md p-2"
            >About</NuxtLink
          >
        </li>
        <li>
          <NuxtLink to="/products" class="hover:shadow-sm rounded-md p-2"
            >Products</NuxtLink
          >
        </li>
      </ul>
    </footer>
  </div>
</template>

<script setup>
</script>

<style scoped></style>
