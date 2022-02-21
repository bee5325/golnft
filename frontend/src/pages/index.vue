<script setup lang="ts">

let maxRows = ref(6);
let initId = ref("0000001C000E000000000000");
let stepCount = ref(0); // TODO: NOT WORKING
let isLoop = ref<"No" | "Yes">("No"); // TODO: NOT WORKING
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
</script>

<template>
  <div>
    <label>Number of rows</label>
    <input type="number" v-model="maxRows" class="border-gray-300 border-1 border-solid px-2 py-1 m-2" min="3" max="16" @input="reset" />
    <p>ID: <span class="font-bold">{{initId}}</span></p>
    <p>Step count: <span class="font-bold">{{stepCount}}</span></p>
    <p>Loop: <span class="font-bold">{{isLoop}}</span></p>
    <button class="btn" @click="randomize" :disabled="running">Random</button>
    <GOLBoard
      :initId="initId"
      :max-rows="maxRows"
      @running="(_run) => running = _run"
      @init-id-changed="(_id) => initId = _id"
    />
  </div>
</template>

<route lang="yaml">
meta:
  layout: home
</route>
