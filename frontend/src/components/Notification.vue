<script setup lang="ts">
defineProps({
  msg: String,
  type: String
});

</script>

<template>
    <div
      v-if="type !== 'none'"
      class="p-5 mx-auto my-2 flex max-w-4xl justify-between"
      :class="{'bg-red-200': type === 'error', 'bg-orange-200': type === 'info'}"
    >
      <p class="m-auto whitespace-pre-line">{{msg}}</p>
      <carbon-close @click="$emit('clearNotification')" class="cursor-pointer" />
    </div>
</template>
