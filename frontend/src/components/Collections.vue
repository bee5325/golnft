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
  status: {
    type: String,
    default: "loading",
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
  <div class="flex justify-center items-center max-w-1500px my-5 mx-auto flex-wrap">
    <p v-if="status === 'error'" class="mt-5 text-lg">Error showing your collections. Please try again later.</p>
    <transition-group
      v-for="col of collections"
      appear
      enter-from-class="transform scale-0"
      leave-to-class="transform scale-0"
      move-class="transition-transform duration-300 ease-out"
      enter-active-class="transition-transform duration-300 ease-explosion"
      leave-active-class="transition-transform duration-300 ease-explosion"
    >
      <div
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
    </transition-group>
    <eos-icons-loading v-if="status === 'loading'" class="text-green-900 w-10 h-10 m-5" />
  </div>
</template>
