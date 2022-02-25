<script setup lang="ts">
defineProps({
  collections: {
    type: Object,
    default() {
      return [];
    }
  }
});
</script>

<template>
  <div>
    <template v-for="col of collections">
      <GOLBoard
        :toggle="false"
        :controls="false"
        :initId="col"
        :small="true"
      />
    </template>
  </div>
</template>
