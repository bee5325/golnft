<script setup lang="ts">
import axios from "axios";
import { config } from "../config";

defineProps({
  collections: {
    type: Object,
    default() {
      return [];
    }
  },
  error: {
    type: Boolean,
    default: false,
  }
});

let hovered = ref<string>("");
let hoveredMeta = ref(null);
let loading = ref(false);

watch(hovered, async (initState: string) => {
  hovered.value = initState;
  loading.value = true;

  if (initState === '') {
    hoveredMeta.value = null;
    loading.value = false;
    return;
  }

  hoveredMeta.value = (await axios.get(`${config.SERVER_URL}/board/${initState}`)).data;
  loading.value = false;
});
</script>

<template>
  <div class="min-h-screen">
    <p v-if="error" class="mt-5 text-lg">Error showing your collections. Please try again later.</p>
    <div
      v-for="col of collections"
      :key="col"
      class="relative inline-block"
      @mouseover="hovered = col"
      @mouseleave="hovered = ''"
      @touchend="if(hovered) hovered = '';"
    >
      <GOLBoard
        :toggle="false"
        :controls="false"
        :initId="col"
        :small="true"
        :forceLoop="hovered === col"
      />
      <transition
        enter-from-class="scale-0"
        leave-to-class="scale-0"
        enter-active-class="transition-transform duration-300 origin-top"
        leave-active-class="transition-transform duration-300 origin-top"
      >
        <GOLInfo
          v-if="hovered === col"
          :meta="hoveredMeta"
          :loading="loading"
          class="absolute top-full left-1/2 transform -translate-x-1/2 text-xs w-lg sm:w-screen"
        />
      </transition>
    </div>
  </div>
</template>
