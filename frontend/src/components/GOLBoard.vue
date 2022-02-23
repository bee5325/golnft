<script setup lang="ts">
let props = defineProps({
  initId: {
    type: String,
    default: "000000000000000000000000",
  },
  toggle: {
    type: Boolean,
    default: true,
  },
  controls: {
    type: Boolean,
    default: true,
  },
  autorun: {
    type: Boolean,
    default: false,
  },
  small: {
    type: Boolean,
    default: false,
  }
});

let emit = defineEmits(["initIdChanged", "running"]);

let maxRows = computed(() => props.initId.length / 4);
let cells = ref(initIdToBoard());
watch([() => props.initId, () => maxRows.value], () => {
  cells.value = initIdToBoard();
});

/**
 * init ID format:
 * Saved as hex string, interpreted as bytes
 *   -> Every 16 bits represents a row. Left most 16 bits (or 4 HEX digits) for row index 0
 *   -> For each 16 bits, LSB for column index 0
 * Curent limit set to 16 rows, 16 columns
 **/

function boardToInitId(): string {
  let rIds = cells.value.map((row) => {
    return row.reduce((rtotal, cell, cIdx) => {
      return cell ? rtotal + (1 << cIdx) : rtotal;
    }, 0)
      .toString(16)
      .padStart(4, '0');
  });
  return rIds.join("");
}
function initIdToBoard(): boolean[][] {
  let emptyBoard = new Array(maxRows.value)
    .fill(0)
    .map(() => new Array(maxRows.value).fill(false));
  if (!props.initId) {
    return emptyBoard;
  }
  let initIdSplit = props.initId.match(/.{1,4}/g);
  if (!initIdSplit) {
    return emptyBoard;
  }

  return initIdSplit.map((rIdStr) => {
    let rIdBin =  parseInt(rIdStr, 16).toString(2).padStart(16, "0");
    return rIdBin.split("").map((cell) => cell === '1').reverse().slice(0, maxRows.value);
  });
}

function nextStep(col: number, row: number): boolean {
  let neighbours = [];

  for (let r = row-1; r <= row+1; r++) {
    for (let c = col-1; c <= col+1; c++) {
      // out of bound
      if (c < 0 || r < 0 || c >= maxRows.value || r >= maxRows.value) {
        continue;
      }
      // self
      if (c === col && r === row) {
        continue;
      }

      neighbours.push([c, r]);
    }
  }

  let alive = cells.value[col][row];
  let aliveNeighbours = neighbours.filter(([c, r]) => cells.value[c][r]).length;

  if (alive && (aliveNeighbours == 2 || aliveNeighbours == 3)) {
    return true;
  }
  if (!alive && aliveNeighbours === 3) {
    return true;
  }
  return false;
}

function step(): boolean {
  let newCells = JSON.parse(JSON.stringify(cells.value));
  let changed = false;
  for (let c = 0; c < maxRows.value; c++) {
    for (let r = 0; r < maxRows.value; r++) {
      newCells[c][r] = nextStep(c, r);
      if (newCells[c][r] !== cells.value[c][r]) {
        changed = true;
      }
    }
  }
  cells.value = newCells;
  if (changed) {
    stepCount.value++;
  }
  return changed
}

// Board controls
let stepCount = ref(0);
let running = ref(false);
let runTimer: number | null  = null;
function run(_run: boolean) {
  const STEP_INTERVAL = 200;
  if (_run) {
    runTimer = window.setInterval(() => {
      let changed = step();
      // stop if state not changing
      if (!changed && runTimer) {
        window.clearInterval(runTimer);
        running.value = false;
      }
    }, STEP_INTERVAL);
  } else if (runTimer)  {
    window.clearInterval(runTimer);
  }

  running.value = _run;
}
function reset() {
  cells.value = initIdToBoard();
  stepCount.value = 0;
}

function toggleCell(c:number, r:number) {
  if (!props.toggle) {
    return;
  }
  if (!running.value) {
    cells.value[r][c] = !cells.value[r][c];
  }
  emit("initIdChanged", boardToInitId());
}

watch(running, () => {
  emit("running", running.value);
});

// autorun
onMounted(() => {
  if (props.autorun) {
    run(true);
  }
});
</script>

<template>
  <div class="inline-block m-2 align-top">
    <div
      class="w-500px h-500px border-1 border-solid border-gray-500 dark:border-gray-50 m-auto p-0 grid"
      :class="[
        `grid-cols-${maxRows}`,
        `grid-rows-${maxRows}`,
        {'w-100px h-100px': small},
        {'border-2 border-green-500': stepCount === 0},
      ]"
    >
      <template v-for="(row, r) in cells">
        <template v-for="(cell, c) in row">
          <GOLCell :col="c" :row="r" :val="cell" @click="toggleCell(c, r)"/>
        </template>
      </template>
    </div>
    <div v-if="controls">
      <button class="btn" @click="step">Step</button>
      <button class="btn" v-if="!running" @click="run(true)">Run</button>
      <button class="btn bg-red-500" v-else @click="run(false)">Stop</button>
      <button class="btn bg-red-500" :disabled="running" @click="reset">Reset</button>
    </div>
  </div>
</template>
