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
  forceLoop: {
    type: Boolean,
    default: false,
  },
  small: {
    type: Boolean,
    default: false,
  },
  width: {
    type: Number,
    default: 0,
  },
  height: {
    type: Number,
    default: 0,
  }
});

let emit = defineEmits(["initIdChanged", "running", "stepCountChanged", "loopChanged"]);

let maxRows = computed(() => props.initId.length / 4);
let cells = ref(initIdToBoard());
watch([() => props.initId, () => maxRows.value], () => {
  reset();
});
let revealed = computed(() => !props.initId.includes("?"));

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

function nextStep(cells: boolean[][], col: number, row: number): boolean {
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

  let alive = cells[col][row];
  let aliveNeighbours = neighbours.filter(([c, r]) => cells[c][r]).length;

  if (alive && (aliveNeighbours == 2 || aliveNeighbours == 3)) {
    return true;
  }
  if (!alive && aliveNeighbours === 3) {
    return true;
  }
  return false;
}

function step(): boolean {
  let newCells = _step(cells.value);
  if (newCells.changed && !loop.value) {
    stepCount.value++;
  }
  cells.value = newCells.newCells;

  if (loopDetected()) {
    loop.value = true;
  }
  return newCells.changed;
}

function _step(cells: boolean[][]): {
  changed: boolean,
  newCells: boolean[][]
} {
  let newCells = JSON.parse(JSON.stringify(cells));
  let changed = false;
  for (let c = 0; c < maxRows.value; c++) {
    for (let r = 0; r < maxRows.value; r++) {
      newCells[c][r] = nextStep(cells, c, r);
      if (newCells[c][r] !== cells[c][r]) {
        changed = true;
      }
    }
  }
  return { changed, newCells };
}

let hare = ref(initIdToBoard()); // used for loop detection
function loopDetected(): boolean {
  let steppedOnce = _step(hare.value);
  if (!steppedOnce.changed) {
    return false;
  }
  hare.value = _step(steppedOnce.newCells).newCells;
  return (JSON.stringify(cells.value) === JSON.stringify(hare.value));
}

// animation in canvas
let canvas = ref<HTMLCanvasElement | null>(null);
let { width: canvasWidth, height: canvasHeight } = useElementSize(canvas);
// allow parent override height and width
onMounted(resetSize);
onActivated(resetSize);
function resetSize() {
  if (props.width > 0) {
    canvasWidth.value = props.width;
  }
  if (props.height > 0) {
    canvasHeight.value = props.height;
  }
}

watch([cells, canvasWidth, canvasHeight], () => {
  nextTick(() => {
    if (!canvas.value) {
      return;
    }

    let ctx = canvas.value.getContext("2d");
    if (!ctx) {
      return;
    }

    const padding = 2;
    const color = "rgb(75, 85, 99)";
    const width = (canvasWidth.value - 2*padding) / maxRows.value;
    const height = (canvasHeight.value - 2*padding) / maxRows.value;

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
    for (let r=0; r<maxRows.value; r++) {
      for (let c=0; c<maxRows.value; c++) {
        ctx.strokeRect(c*width+padding, r*height+padding, width, height);
        if (cells.value[r][c]) {
          ctx.fillRect(c*width+padding, r*height+padding, width, height);
        }
      }
    }
    if (!revealed.value) {
      ctx.fillStyle = "rgba(75, 85, 99, 0.5)";
      ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
    }
  });
});

// Board controls
let stepCount = ref(0);
let loop = ref(false);
let restart = ref(false);
let running = ref(false);
let runTimer: number | null  = null;
function run(_run: boolean) {
  const STEP_INTERVAL = 200;
  if (_run) {
    if (restart.value) {
      reset();
      restart.value = false;
    }
    runTimer = window.setInterval(() => {
      let changed = step();
      // stop if state not changing
      if (!changed && runTimer) {
        window.clearInterval(runTimer);
        running.value = false;
        restart.value = true;
      }
    }, STEP_INTERVAL);
  } else if (runTimer)  {
    window.clearInterval(runTimer);
  }

  running.value = _run;
}
function reset() {
  cells.value = initIdToBoard();
  hare.value = initIdToBoard();
  loop.value = false;
  stepCount.value = 0;
}

function toggleCell(e: MouseEvent) {
  if (!props.toggle || running.value || !canvas.value) {
    return;
  }
  const canvasRect = canvas.value.getBoundingClientRect();
  const width = canvasRect.width / maxRows.value;
  const height = canvasRect.height / maxRows.value;
  const pos = {
    x: e.clientX - canvasRect.x,
    y: e.clientY - canvasRect.y,
  }
  let r = Math.floor(pos.y / height);
  let c = Math.floor(pos.x / width);
  cells.value[r][c] = !cells.value[r][c];
  emit("initIdChanged", boardToInitId());
}

watch(running, () => {
  emit("running", running.value);
});
watch(stepCount, () => {
  emit("stepCountChanged", stepCount.value);
});
watch(loop, () => {
  emit("loopChanged", loop.value);
});

// autorun
watch(() => props.initId, () => {
  if (props.autorun && revealed.value) {
    run(true);
  }
});

// forceLoop
watch(
  [() => props.forceLoop, restart],
  ([newLoop, newRestart], [oldLoop]) => {
  // force loop value changed
  if (oldLoop !== newLoop) {
    reset();
    if (newLoop) {
      run(true);
    } else {
      run(false);
    } 
  }
  // restart after finish
  if (newLoop && newRestart) {
    run(true);
  }
});
</script>

<template>
  <div class="inline-block m-2 align-top">
    <canvas
      class="w-full aspect-square m-auto p-0"
      :width="small ? 100 : canvasWidth"
      :height="small ? 100 : canvasHeight"
      ref="canvas"
      @click="toggleCell"
    >
    </canvas>
    <div v-if="controls">
      <button class="btn" :disabled="running || !revealed" @click="step">Step</button>
      <button class="btn" v-if="!running" @click="run(true)" :disabled="!revealed">Run</button>
      <button class="btn bg-red-500" v-else @click="run(false)">Stop</button>
      <button class="btn bg-red-500" :disabled="running || !revealed" @click="reset">Reset</button>
    </div>
  </div>
</template>

<style>
.aspect-square {
  aspect-ratio: 1;
}
</style>
