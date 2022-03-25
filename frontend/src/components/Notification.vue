<script setup lang="ts">
defineProps({
  msg: String,
  type: String,
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
      class="p-5 w-11/12 mt-5 flex max-w-4xl justify-between z-10 fixed top-0 left-1/2 transform -translate-x-1/2 bg-gray-50 shadow-md rounded"
      :class="{
        'text-red-800': type === 'error',
        'text-green-800': type === 'ainfo',
      }"
    >
      <p class="basis-11/12 m-auto break-words whitespace-pre-line">
        <span v-if="msg">{{ msg }}</span>
        <slot v-else />
      </p>
      <carbon-close
        @click="$emit('clearNotification')"
        class="cursor-pointer"
      />
    </div>
  </Transition>
</template>

<style lang="postcss" scoped>
:deep(a) {
  @apply text-green-500 opacity-75 font-500 underline hover:opacity-100 hover:text-green-700;
}
</style>
