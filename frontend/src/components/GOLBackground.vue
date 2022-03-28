<script setup lang="ts">
const CELL_SIZE = 20;
let { width, height } = useWindowSize();

let rows = computed(() => Math.ceil(height.value / CELL_SIZE));
let cols = computed(() => Math.ceil(width.value / CELL_SIZE));
let cells = ref<boolean[][]>([
  [false, false, false],
  [false, false, false],
  [false, false, false],
]);

function randomizeCells() {
  cells.value = [];
  for (let row = 0; row < rows.value; row++) {
    let thisRow = [];
    for (let col = 0; col < cols.value; col++) {
      const ALIVE_CHANCE = 0.2;
      thisRow.push(Math.random() < ALIVE_CHANCE ? true : false);
    }
    cells.value.push(thisRow);
  }
  run();
}

onMounted(randomizeCells);
watch([rows, cols], randomizeCells);

function nextStep(cells: boolean[][], col: number, row: number): boolean {
  let neighbours = [];

  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      // out of bound
      if (c < 0 || r < 0 || c >= cols.value || r >= rows.value) {
        continue;
      }
      // self
      if (c === col && r === row) {
        continue;
      }

      neighbours.push([c, r]);
    }
  }

  let alive = cells[row][col];
  try {
    let aliveNeighbours = neighbours.filter(([c, r]) => cells[r][c]).length;

    if (alive && (aliveNeighbours == 2 || aliveNeighbours == 3)) {
      return true;
    }
    if (!alive && aliveNeighbours === 3) {
      return true;
    }
  } catch (err) {
    console.log(err);
  }
  return false;
}

function step(): boolean {
  let newCells = _step(cells.value);
  cells.value = newCells.newCells;

  return newCells.changed;
}

function _step(cells: boolean[][]): {
  changed: boolean;
  newCells: boolean[][];
} {
  let newCells = JSON.parse(JSON.stringify(cells));
  let changed = false;
  for (let c = 0; c < cols.value; c++) {
    for (let r = 0; r < rows.value; r++) {
      newCells[r][c] = nextStep(cells, c, r);
      if (newCells[r][c] !== cells[r][c]) {
        changed = true;
      }
    }
  }
  return { changed, newCells };
}

// animation in canvas
let canvas = ref<HTMLCanvasElement | null>(null);
let { width: canvasWidth, height: canvasHeight } = useElementSize(canvas);
watch([cells], () => {
  nextTick(() => {
    if (!canvas.value) {
      return;
    }

    let ctx = canvas.value.getContext("2d");
    if (!ctx) {
      return;
    }

    const color = "rgb(75, 85, 99)";

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.clearRect(0, 0, width.value, height.value);
    for (let r = 0; r < rows.value; r++) {
      for (let c = 0; c < cols.value; c++) {
        ctx.strokeRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        if (cells.value[r][c]) {
          ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }
  });
});

// Board controls
let runTimer: number | null = null;
function run() {
  // don't run twice
  if (runTimer) {
    return;
  }
  const STEP_INTERVAL = 300;
  runTimer = window.setInterval(step, STEP_INTERVAL);
}
</script>

<template>
  <div class="fixed -z-10 inset-0 m-0 align-top">
    <canvas
      class="w-full h-full m-auto p-0 opacity-10"
      :width="canvasWidth"
      :height="canvasHeight"
      ref="canvas"
    >
    </canvas>
  </div>
  <div
    class="fixed inset-0 -z-5 bg-gradient-to-r from-transparent via-white to-transparent"
  />
</template>

<style>
.aspect-square {
  aspect-ratio: 1;
}
</style>
