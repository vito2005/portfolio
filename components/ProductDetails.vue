<template>
  <div class="card">
    <div class="grid grid-cols-2 gap-10">
      <div class="p-7">
        <img :src="product.image" alt="product img" class="mx-auto my-7" />
      </div>
      <div class="p-7">
        <h2 class="text-4xl font-bold text-gray-500 my-7 truncate">
          {{ product.title }}
        </h2>
        <p class="text-xl my-7">Price: {{ price }} {{ currency }}</p>
        <h3 class="font-bold border-b-2 border-gray-200 mb-4 pb-2">
          Product description
        </h3>
        <p class="text-gray-500 mb-7">
          {{ product.description }}
        </p>
        <button class="btn flex items-center">
          <i class="material-icons mr-2">add_shopping_cart</i>
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const { product, currencyRate } = defineProps({
  product: {
    type: Object,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  currencyRate: {
    type: Number,
    required: true,
  },
});

const price = computed(() => (product.price * currencyRate).toFixed(2));
</script>

<style scoped></style>
