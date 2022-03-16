<script setup lang="ts">
import axios from "axios";

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
let hoveredLeft = ref(0);
let hoveredMeta = ref(null);
let loading = ref(false);
let cache: Record<string, any> = {};

async function setHovered(initState: string, ref: HTMLElement | null) {
  hovered.value = initState;
  loading.value = true;

  if (initState === '' || ref === null) {
    hoveredMeta.value = null;
    loading.value = false;
    return;
  }

  let rect = ref.getBoundingClientRect();
  hoveredLeft.value = rect.left;
  if (cache[initState]) {
    hoveredMeta.value = cache[initState];
  } else {
    hoveredMeta.value = (await axios.get(`${import.meta.env.SERVER_URL}/board/${initState}`)).data;
    cache[initState] = hoveredMeta.value;
  }
  loading.value = false;
}

</script>

<template>
  <div class="flex justify-center items-center max-w-1500px my-5 mx-auto flex-wrap pb-300px">
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
        @mouseover="setHovered(col, $event.target as HTMLElement)"
        @mouseleave="setHovered('', null)"
        @touchend="if(hovered) setHovered('', null); else setHovered(col, $event.target as HTMLElement);"
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
            :left="hoveredLeft"
            class="absolute top-full left-0 text-xs w-lg"
          />
        </transition>
      </div>
    </transition-group>
    <eos-icons-loading v-if="status === 'loading'" class="text-green-900 w-10 h-10 m-5" />
  </div>
</template>
