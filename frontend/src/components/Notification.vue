<script setup lang="ts">
defineProps({
  msg: String,
  type: String
});

</script>

<template>
  <Transition
    name="expand-down"
    enter-active-class="transition-transform duration-300 origin-top"
    leave-active-class="transition-transform duration-300 origin-top"
    enter-from-class="scale-y-0"
    leave-to-class="scale-y-1"
  >
    <div
      v-if="type !== 'none'"
      class="p-5 w-min-800px mt-2 flex max-w-4xl justify-between absolute top-0 left-1/2 transform -translate-x-1/2"
      :class="{'bg-red-200': type === 'error', 'bg-orange-200': type === 'info'}"
    >
      <p class="m-auto whitespace-pre-line">{{msg}}</p>
      <carbon-close @click="$emit('clearNotification')" class="cursor-pointer" />
    </div>
  </Transition>
</template>
