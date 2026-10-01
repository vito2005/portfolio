<template>
  <div class="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
    <h2 class="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
      <slot />
    </h2>
    <div v-if="$slots.aside" class="text-sm">
      <slot name="aside" />
    </div>
  </div>
</template>
