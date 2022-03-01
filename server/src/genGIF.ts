import 'dotenv/config';
import { createCanvas } from 'canvas';
import * as fs from 'fs';
import GIFEncoder from 'gifencoder';
import path from 'path';
import pinataSDK from '@pinata/sdk';
import { PinataClient } from '@pinata/sdk';
import { TokenMeta } from './database';

const canvasWidth = 350;
const canvasHeight = 350;
let pinata: PinataClient;

async function genGIF(initState: string): Promise<{
  gifUrl: string,
  stepCount: number,
  loop: boolean
}> {
  if (process.env.NODE_ENV === "development") {
    return { gifUrl: "Some gif url", stepCount: 101, loop: true };
  }
  const gifLoopCount = 3;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  const rows = initState.length / 4;
  const padding = 2;
  const color = "rgb(75, 85, 99)";
  const width = (canvasWidth - 2*padding) / rows;
  const height = (canvasHeight - 2*padding) / rows;
  const filePath = path.resolve(`../tmp/${initState}.gif`);

  const encoder = new GIFEncoder(canvasWidth, canvasHeight);
  if (!fs.existsSync(path.resolve("../tmp"))) {
    fs.mkdirSync(path.resolve("../tmp"));
  }
  encoder.createReadStream().pipe(fs.createWriteStream(filePath));
  encoder.start();
  encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
  encoder.setDelay(200);  // frame delay in ms
  encoder.setQuality(10);

  let loopCount = 0;
  let stepCount = 0;
  let loop = false;
  let cells = initIdToBoard(initState);
  let hare = initIdToBoard(initState); // for loop detection

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  // max step limit 200
  console.log("Start generate gif");
  for (let step=0; step<200; step++) {
    // draw on canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = color;
    for (let r=0; r<rows; r++) {
      for (let c=0; c<rows; c++) {
        ctx.strokeRect(c*width+padding, r*height+padding, width, height);
        if (cells[r][c]) {
          ctx.fillRect(c*width+padding, r*height+padding, width, height);
        }
      }
    }
    encoder.addFrame(ctx);

    // update cells state
    let { changed, newCells } = stepCells(cells);

    // check for step count and loop
    let hareChanged;
    ({ cells: hare, changed: hareChanged } = advanceHare(hare));
    if (hareChanged && loopDetected(cells, hare)) {
      // loop enough, stop generating gif
      if (loopCount++ >= gifLoopCount) {
        break;
      } else if (loopCount === 1) {
        // start of loop, stop increment stepCount
        stepCount = step;
        loop = true;
      }
    }
    if (!changed) {
      stepCount = step;
      break;
    }
    cells = newCells;
  }

  encoder.addFrame(ctx); // let the last frame last longer
  encoder.finish();

  await fileGenerated(filePath);
  console.log("Done generate gif");
  console.log("Start upload gif");
  let gifUrl = await uploadIPFS(filePath);
  console.log("Done upload gif");
  return { gifUrl, stepCount, loop };
}

async function genMeta(initState: string, meta: TokenMeta) {
  if (process.env.NODE_ENV === "development") {
    return "URL for metafile";
  }
  console.log("Start upload metafile");
  let res = await pinata.pinJSONToIPFS(
    meta,
    { pinataMetadata: { name: `${initState}.json` }}
  );
  console.log("Done upload metafile");
  return `https://ipfs.io/ipfs/${res.IpfsHash}`;
}

/**
  * Helper functions
  **/
function initIdToBoard(initState: string): boolean[][] {
  const rows = initState.length / 4;

  let emptyBoard = new Array(rows)
    .fill(0)
    .map(() => new Array(rows).fill(false));

  let initIdSplit = initState.match(/.{1,4}/g);
  if (!initIdSplit) {
    return emptyBoard;
  }

  return initIdSplit.map((rIdStr) => {
    let rIdBin =  parseInt(rIdStr, 16).toString(2).padStart(16, "0");
    return rIdBin.split("").map((cell) => cell === '1').reverse().slice(0, rows);
  });
}

function nextStep(cells: boolean[][], col: number, row: number): boolean {
  let neighbours = [];
  let rows = cells.length;

  for (let r = row-1; r <= row+1; r++) {
    for (let c = col-1; c <= col+1; c++) {
      // out of bound
      if (c < 0 || r < 0 || c >= rows || r >= rows) {
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

function stepCells(cells: boolean[][]): {
  changed: boolean,
  newCells: boolean[][]
} {
  let newCells = JSON.parse(JSON.stringify(cells));
  let changed = false;
  let rows = cells.length;

  for (let c = 0; c < rows; c++) {
    for (let r = 0; r < rows; r++) {
      newCells[c][r] = nextStep(cells, c, r);
      if (newCells[c][r] !== cells[c][r]) {
        changed = true;
      }
    }
  }
  return { changed, newCells };
}

async function fileGenerated(file: string) {
  await new Promise<void>((res, rej) => {
    let safetyCounter = 50;
    let checkFileExists = () => {
      if (fs.existsSync(file)) {
        res();
      } else {
        safetyCounter--;
        if (safetyCounter <= 0) {
          rej();
        }
        setTimeout(checkFileExists, 100);
      }
    }
    setTimeout(checkFileExists, 100);
  });
}

async function uploadIPFS(filePath: string) {
  try {
    let file = fs.createReadStream(filePath);
    let res = await pinata.pinFileToIPFS(file);
    return `https://ipfs.io/ipfs/${res.IpfsHash}`;
  } catch (err) {
    console.log("Error:", err);
    return "";
  }
}

function advanceHare(hare: boolean[][]) {
  let stepOnce = stepCells(hare);
  let newHare = stepCells(stepOnce.newCells);
  return { cells: newHare.newCells, changed: newHare.changed }
}

function loopDetected(turtle: boolean[][], hare: boolean[][]) {
  return JSON.stringify(turtle) === JSON.stringify(hare);
}

// setup
async function setup() {
  for (let key of ["PINATA_API_KEY", "PINATA_API_SECRET", "SITE_URL"]) {
    if (!process.env[key]) {
      throw new Error(`${key} is not set in environment variables`);
    }
  }
  pinata = pinataSDK(process.env.PINATA_API_KEY!, process.env.PINATA_API_SECRET!);
  await pinata.testAuthentication();
}
setup();

export { genGIF, genMeta };
