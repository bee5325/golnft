<template>
  <main class="px-4 py-10 text-center text-gray-700 dark:text-gray-200">
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <Footer />
  </main>
</template>
