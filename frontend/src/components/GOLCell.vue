<script setup lang="ts">
defineProps({
  val: Boolean,
});
</script>

<template>
  <div
    class="w-full h-full border-solid border-gray-600 dark:border-gray-300 border-1 m-0"
    :class="val ? 'bg-gray-600 dark:bg-gray-300' : ''"
  />
</template>
