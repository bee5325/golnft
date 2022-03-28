<script setup lang="ts">
let maxRows = ref(6);
let initId = ref(
  "000010045008300e00000000000000000000000000000000700c100a20080000"
);
let initIdRaw = ref(initId.value);
let stepCount = ref(0);
let isLoop = ref<"No" | "Yes">("No");
let running = ref(false);

maxRows.value = 100;
function randomize() {
  let rows = Array(maxRows.value)
    .fill(0)
    .map(() => {
      let row = Array(maxRows.value)
        .fill(0)
        .reduce((rowTotal, _, rIdx) => {
          const ALIVE_CHANCE = 0.2;
          return Math.random() < ALIVE_CHANCE
            ? rowTotal + (1 << rIdx)
            : rowTotal;
        }, 0);
      return row.toString(16).padStart(4, "0");
    });
  initIdRaw.value = rows.join("");
  console.log(initIdRaw.value);
  stepCount.value = 0;
}

function clear() {
  initIdRaw.value = "".padStart(4 * maxRows.value, "0");
}

function reset() {
  if (initId.value.length % 4 !== 0) {
    return;
  }
  initIdRaw.value = initId.value
    .padEnd(maxRows.value * 4, "0")
    .slice(0, maxRows.value * 4);
}

let showHelp = ref(false);

watchEffect(() => {
  maxRows.value = initId.value.length / 4;
});

watchEffect(() => {
  let rows = initIdRaw.value.length / 4;
  if (initIdRaw.value.length % 4 === 0 && rows >= 3 && rows <= 16) {
    initId.value = initIdRaw.value;
  }
});
</script>

<template>
  <div>
    <GOLBackground />
    <h1 class="uppercase">Conway's Game of Life</h1>
    <Intro class="intro pb-0 mb-10" />
    <h1 class="uppercase">
      Explore
      <a href="#" @click.prevent="showHelp = !showHelp">
        <carbon-help
          class="w-6 absolute text-green-800 opacity-50 ml-2 hover:text-green-400 transition-colors cursor-pointer"
        ></carbon-help
      ></a>
    </h1>
    <transition
      enter-from-class="scale-y-0 opacity-0"
      leave-to-class="scale-y-0 opacity-0"
      enter-active-class="transition-all origin-top duration-400"
      leave-active-class="transition-all origin-top duration-400"
    >
      <ExploreHelp
        v-show="showHelp"
        @close-help="showHelp = false"
        class="absolute left-1/2 w-11/12 max-w-2xl transform -translate-x-1/2"
      />
    </transition>
    <div class="w-11/12 m-auto grid grid-cols-1 md:grid-cols-3 items-center">
      <GOLBoard
        class="md:col-start-2"
        :initId="initId"
        @running="(_run) => (running = _run)"
        @init-id-changed="(_id) => (initIdRaw = _id)"
        @step-count-changed="(_step) => (stepCount = _step)"
        @loop-changed="(_loop) => (isLoop = _loop ? 'Yes' : 'No')"
      />
      <div
        class="inline-block w-full border-1 rounded-md border-solid border-gray-500 p-5"
      >
        <label>Number of rows (3 - 16)</label>
        <input
          type="number"
          v-model="maxRows"
          class="border-gray-300 border-1 border-solid px-2 py-1 m-2"
          min="3"
          max="16"
          @change="reset"
        />
        <p>
          ID:
          <input
            class="font-bold break-all border-gray-300 border-1 border-solid w-3/4 px-2 py-1 m-2"
            v-model="initIdRaw"
          />
        </p>
        <p>
          Step count: <span class="font-bold">{{ stepCount }}</span>
        </p>
        <p>
          Loop: <span class="font-bold">{{ isLoop }}</span>
        </p>
        <button class="btn" @click="randomize" :disabled="running">
          Random
        </button>
        <button class="btn" @click="clear" :disabled="running">Clear</button>
      </div>
    </div>
    <div class="p-10 w-full bg-green-700 text-white mt-5 pb-80px">
      <p class="font-bold text-2xl pb-5">Ready to get one for yourself?</p>
      <router-link
        class="btn hover:bg-green-200 hover:transform hover:scale-125 transition-transform py-3 px-10 bg-white text-green-900"
        to="mint"
      >
        Mint your NFT now!
      </router-link>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.intro :deep(ul) {
  @apply p-0;
}

.intro :deep(li::before) {
  @apply hidden;
}

.intro :deep(li) {
  @apply py-2 px-5 border-green-500 border-solid border-1 rounded;
}
</style>
