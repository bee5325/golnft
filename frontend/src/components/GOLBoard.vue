<script setup lang="ts">
let props = defineProps({
  maxRows: {
    type: Number,
    default: 6,
  },
  initId: {
    type: String,
    default: "000000000000000000000000",
  },
});

let emit = defineEmits(["initIdChanged", "running"]);

let cells = ref(initIdToBoard());
watch([() => props.initId, () => props.maxRows], () => {
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
  let emptyBoard = new Array(props.maxRows)
    .fill(0)
    .map(() => new Array(props.maxRows).fill(false));
  if (!props.initId) {
    return emptyBoard;
  }
  let initIdSplit = props.initId.match(/.{1,4}/g);
  if (!initIdSplit) {
    return emptyBoard;
  }

  return initIdSplit.map((rIdStr) => {
    let rIdBin =  parseInt(rIdStr, 16).toString(2).padStart(16, "0");
    return rIdBin.split("").map((cell) => cell === '1').reverse().slice(0, props.maxRows);
  });
}

function nextStep(col: number, row: number): boolean {
  let neighbours = [];

  for (let r = row-1; r <= row+1; r++) {
    for (let c = col-1; c <= col+1; c++) {
      // out of bound
      if (c < 0 || r < 0 || c >= props.maxRows || r >= props.maxRows) {
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
  for (let c = 0; c < props.maxRows; c++) {
    for (let r = 0; r < props.maxRows; r++) {
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
  if (!running.value) {
    cells.value[r][c] = !cells.value[r][c];
  }
  emit("initIdChanged", boardToInitId());
}

watch(running, () => {
  emit("running", running.value);
});
</script>

<template>
  <div>
    <div
      class="w-500px h-500px border-1 border-solid border-gray-500 dark:border-gray-50 m-auto p-0 grid"
      :class="`grid-cols-${maxRows} grid-rows-${maxRows}`"
    >
      <template v-for="(row, r) in cells">
        <template v-for="(cell, c) in row">
          <GOLCell :col="c" :row="r" :val="cell" @click="toggleCell(c, r)"/>
        </template>
      </template>
    </div>
    <button class="btn" @click="step">Step</button>
    <button class="btn" v-if="!running" @click="run(true)">Run</button>
    <button class="btn bg-red-500" v-else @click="run(false)">Stop</button>
    <button class="btn bg-red-500" :disabled="running" @click="reset">Reset</button>
  </div>
</template>
