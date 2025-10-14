<template>
  <div class="grid grid-cols-4 gap-4">
    <div v-for="p in products" :key="p.id">
      <ProductCard :product="p" />
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "products",
});

const { data: products } = await useFetch("https://fakestoreapi.com/products");

useHead({
  title: "Products",
  meta: [{ name: "description", content: "Products Page" }],
});
</script>

<style lang="scss" scoped></style>
