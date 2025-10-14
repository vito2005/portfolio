<template>
  <div class="card text-center">
    <img :src="product.image" alt="product thumb" class="thumb" />
    <h3 class="text-lg font-bold text-gray-500 m-4 truncate">
      {{ product.title }}
    </h3>
    <NuxtLink :to="`/products/${product.id}`">
      <p class="btn my-4">View Details</p>
    </NuxtLink>
  </div>
</template>

<script setup>
const { product } = defineProps({
  product: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.thumb {
  @apply h-48 object-cover rounded-lg max-w-[70%] mx-auto;
}
</style>
