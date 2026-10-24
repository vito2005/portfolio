<template>
  <div class="flex min-h-screen flex-col overflow-x-clip bg-paper">
    <SiteHeader />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
