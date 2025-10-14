<template>
  <div>
    <Head>
      <Title>{{ product.title }}</Title>
      <Meta name="description" :content="product.description" />
    </Head>
    <ProductDetails
      :product="product"
      :currency="currency"
      :currency-rate="currencyRate"
    />
  </div>
</template>

<script setup>
const { id } = useRoute().params;
const uri = "https://fakestoreapi.com/products/" + id;
const { data: product } = await useFetch(uri, { key: id });
const currency = "EUR";
const { data } = await useFetch(`/api/currency/${currency}`);
console.log("data.data.value", data.value);
const currencyRate = data.value[currency].value;

definePageMeta({
  layout: "products",
});
</script>

<style lang="scss" scoped></style>
