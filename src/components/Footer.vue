<script setup lang="ts">
import { isDark, toggleDark } from '~/composables'
</script>

<template>
  <nav class="text-xl mt-6">
    <router-link class="icon-btn mx-2" to="/" title="Home">
      <carbon-campsite />
    </router-link>

    <button class="icon-btn mx-2 !outline-none" title="Toggle dark" @click="toggleDark()">
      <carbon-moon v-if="isDark" />
      <carbon-sun v-else />
    </button>

    <router-link class="icon-btn mx-2" to="/about" title="About">
      <carbon-dicom-overlay />
    </router-link>
  </nav>
</template>
