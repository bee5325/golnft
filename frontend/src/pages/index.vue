<script setup lang="ts">
let maxRows = ref(6);
let initId = ref("0000001C000E000000000000");
let stepCount = ref(0);
let isLoop = ref<"No" | "Yes">("No");
let running = ref(false);

function randomize() {
  let rows = Array(maxRows.value).fill(0).map(() => {
    let row = Array(maxRows.value).fill(0).reduce((rowTotal, _, rIdx) => {
      const ALIVE_CHANCE = 0.2;
      return (Math.random() < ALIVE_CHANCE) ? rowTotal + (1 << rIdx) : rowTotal;
    }, 0);
    return row.toString(16).padStart(4, "0");
  });
  initId.value = rows.join("");
  stepCount.value = 0;
}

function reset() {
  initId.value = initId.value.padEnd(maxRows.value*4, "0").slice(0, maxRows.value*4);
}

watchEffect(() => {
  maxRows.value = initId.value.length / 4;
});
</script>

<template>
  <div>
    <h1 class="font-bold text-green-600 text-2xl uppercase m-2">Explore</h1>
    <div class="w-11/12 m-auto grid grid-cols-3 items-center">
      <GOLBoard
        class="col-start-2"
        :initId="initId"
        :max-rows="maxRows"
        @running="(_run) => running = _run"
        @init-id-changed="(_id) => initId = _id"
        @step-count-changed="(_step) => stepCount = _step"
        @loop-changed="(_loop) => isLoop = _loop ? 'Yes' : 'No'"
      />
      <div class="inline-block w-full border-1 rounded-md border-solid border-gray-500 p-5">
        <label>Number of rows</label>
        <input type="number" v-model="maxRows" class="border-gray-300 border-1 border-solid px-2 py-1 m-2" min="3" max="16" @input="reset" />
        <p>
          ID:
          <input class="font-bold break-all" v-model="initId" />
        </p>
        <p>Step count: <span class="font-bold">{{stepCount}}</span></p>
        <p>Loop: <span class="font-bold">{{isLoop}}</span></p>
        <button class="btn" @click="randomize" :disabled="running">Random</button>
      </div>
    </div>
  </div>
</template>
