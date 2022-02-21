<script setup lang="ts">
let maxRows = ref(6);
let cells = ref([
  [false, false, false, false, false, false], // 000000 (0)
  [false, false, false, false, false, false], // 000000 (0)
  [false, false, true, true, true, false],    // 011100 (0)
  [false, true, true, true, false, false],    // 001110 (0)
  [false, false, false, false, false, false], // 000000 (0)
  [false, false, false, false, false, false], // 000000 (0)
]);
/**
 * init ID format:
 * Saved as hex string, interpreted as bytes
 *   -> Every 16 bits represents a row. Left most 16 bits (or 4 HEX digits) for row index 0
 *   -> For each 16 bits, LSB for column index 0
 * Curent limit set to 16 rows, 16 columns
 **/

let initId = ref(boardToInitId());
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
  if (!initId) {
    return emptyBoard;
  }
  let initIdSplit = initId.value.match(/.{1,4}/g);
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

let stepCount = ref(0);
let isLoop = ref<"No" | "Yes">("No");
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
  initId.value = initId.value.padEnd(maxRows.value*4, "0").slice(0, maxRows.value*4);
  cells.value = initIdToBoard();
  stepCount.value = 0;
}

function randomize() {
  let rows = Array(maxRows.value).fill(0).map(() => {
    let row = Array(maxRows.value).fill(0).reduce((rowTotal, _, rIdx) => {
      const ALIVE_CHANCE = 0.2;
      return (Math.random() < ALIVE_CHANCE) ? rowTotal + (1 << rIdx) : rowTotal;
    }, 0);
    return row.toString(16).padStart(4, "0");
  });
  initId.value = rows.join("");
  cells.value = initIdToBoard();
  stepCount.value = 0;
}

function toggleCell(c:number, r:number) {
  if (!running.value) {
    cells.value[r][c] = !cells.value[r][c];
  }
  initId.value = boardToInitId();
}
</script>

<template>
  <div>
    <label>Number of rows</label>
    <input type="number" v-model="maxRows" class="border-gray-300 border-1 border-solid px-2 py-1 m-2" min="3" max="16" @input="reset"/>
    <p>ID: <span class="font-bold">{{initId}}</span></p>
    <p>Step count: <span class="font-bold">{{stepCount}}</span></p>
    <p>Loop: <span class="font-bold">{{isLoop}}</span></p>
    <button class="btn" @click="randomize" :disabled="running">Random</button>
    <div class="w-500px h-500px border-1 border-solid border-gray-500 dark:border-gray-50 m-auto p-0 grid"
      :class="`grid-cols-${maxRows} grid-rows-${maxRows}`">
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
