<script setup lang="ts">
type UrlString = string;
type Traits =
  { trait_types: "Step count", value: number } |
  { trait_types: "Loop", value: "Yes" | "No" };
interface TokenMeta {
  name: string;
  date: number;
  rows: number;
  description: string;
  initState: string;
  image: UrlString;
  externalUrl: UrlString;
  attributes: Array<Traits>;
  baseTokenUrl?: UrlString;
}
interface GolInfoProps {
  meta: TokenMeta | null;
  loading: boolean;
  left?: number,
}

let props = withDefaults(
  defineProps<GolInfoProps>(), 
  {
    loading: false,
  }
);

let popup = ref(null);
const { width: windowWidth } = useWindowSize();
const padding = 40;

let width = computed(() => {
  let maxWidth = 550;
  return Math.min(maxWidth, windowWidth.value - padding);
});

const correction = computed(() => {
  if (!props.left) {
    return 0;
  }

  if (props.left + width.value > windowWidth.value - padding/2) {
    return props.left + width.value - (windowWidth.value - padding/2);
  }
  return 0;
});
</script>

<template>
  <div
    class="transform translate-x-0 inline-block p-4 rounded-md border-1 border-solid border-gray-400 bg-white z-1"
    :class="`-translate-x-[${correction}px] max-w-[${width}px]`"
    ref="popup"
  >
    <eos-icons-loading v-if="loading" class="text-green-900 w-6 h-6 ml-2" />
    <transition
      v-else-if="meta"
      enter-from-class="scale-0"
      leave-to-class="scale-0"
      enter-active-class="transition-transform duration-300 origin-top"
      leave-active-class="transition-transform duration-300 origin-top"
    >
      <table class="text-left table-fixed">
        <tr>
          <td class="py-2"><label class="mr-2 whitespace-nowrap">Name:</label></td>
          <td class="py-2"><span class="font-bold break-all">{{meta.name}}</span></td>
        </tr>
        <tr>
          <td class="py-2"><label class="mr-2 whitespace-nowrap">Created on:</label></td>
          <td class="py-2"><span class="font-bold">{{new Date(meta.date).toDateString()}}</span></td>
        </tr>
        <tr>
          <td class="py-2"><label class="mr-2 whitespace-nowrap">Init state:</label></td>
          <td class="py-2"><span class="font-bold break-all">{{meta.initState}}</span></td>
        </tr>
        <tr>
          <td class="py-2"><label class="mr-2 whitespace-nowrap">Number of rows:</label></td>
          <td class="py-2"><span class="font-bold">{{meta.rows}}</span></td>
        </tr>
        <tr>
          <td class="py-2"><label class="mr-2 whitespace-nowrap">GIF URL:</label></td>
          <td class="py-2"><a :href="meta.image" target="_blank" class="text-blue-500">GIF file <ic-baseline-open-in-new /></a></td>
        </tr>
        <tr v-for="attr of meta.attributes" :key="attr.trait_types">
          <td class="py-2"><label class="mr-2 whitespace-nowrap">{{attr.trait_types}}:</label></td>
          <td class="py-2"><span class="font-bold">{{attr.value}}</span></td>
        </tr>
      </table>
    </transition>
  </div>
</template>
