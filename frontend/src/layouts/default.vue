<template>
  <main
    class="p-0 text-center text-gray-700 overflow-hidden"
  >
    <Header />
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </main>
</template>
