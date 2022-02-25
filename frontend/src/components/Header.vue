<script setup lang="ts">
import { isDark, toggleDark } from '~/composables'
</script>

<template>
  <nav class="text-xl m-0 mb-5 w-full py-3 bg-green-600 text-gray-50 flex items-center justify-end pr-5">
    <router-link class="icon-btn mx-2" to="/" title="Home">
      Home
    </router-link>

    <router-link class="icon-btn mx-2" to="/mint" title="Mint">
      Mint
    </router-link>

    <button class="icon-btn mx-2 !outline-none" title="Toggle dark" @click="toggleDark()">
      <carbon-moon v-if="isDark" />
      <carbon-sun v-else />
    </button>
  </nav>
</template>
