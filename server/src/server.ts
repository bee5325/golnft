// Imports dependencies and set up http server
import "dotenv/config";
import express from 'express';
import { ethers } from 'ethers';
import cors from 'cors';

const port = 3000;

const app = express();
app.use(express.json());
app.use(cors());

let taken: Record<number, Set<string>> = {};
let collections: Record<string, Array<string>> = {};

app.put("/board", async (req, res) => {
  let { account, rows } = req.body;

  // check if rows supported
  if (rows < 3 || rows > 16) {
    res.status(400).send({ msg: `Rows must be between 3 and 16` });
    return;
  }

  // check if all taken
  if (taken[rows] === undefined) {
    taken[rows] = new Set();
  }
  const takenCount = taken[rows].size;
  if (takenCount === Math.pow(2, rows*rows)) {
    res.status(400).send({ msg: `All possibilities were already taken for ${rows} rows` });
    return;
  }

  // get a non repeated init state
  let initState = randomize(rows);
  while (taken[rows].has(initState)) {
    initState = randomize(rows);
  }
  taken[rows].add(initState);

  // calculate signature to make sure it comes from the server itself
  let signature = await getSignature(rows, initState, account);
  collections[account] = collections[account]
    ? [...collections[account], initState]
    : [initState];

  res.send({
    initState: initState.toHexString().replace("0x", "").padStart(rows*4, "0"),
    signature
  });
});

app.get("/collections", (req, res) => {
  // let { account } = req.body;
  console.log(collections);
  res.send(collections);
});

app.listen(port, () => {
  console.log(`Express is listening at http://localhost:${port}`);
});

/**
 *
 * helper functions
 *
 **/
async function getSignature(rows: number, initState: ethers.BigNumber, address: string) {
  let signer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"); //process.env.PRIVATE_KEY!);
  let abiCoder = ethers.utils.defaultAbiCoder;

  return await signer.signMessage(
    ethers.utils.arrayify(
      ethers.utils.keccak256(
        abiCoder.encode(
          ['uint', 'uint', 'address'],
          [rows, initState, address]
        )
      )
    )
  )
};

function randomize(maxRows: number) {
  let rows = Array(maxRows).fill(0).reduce((total, _, idx) => {
    let row = Array(maxRows).fill(0).reduce((rowTotal, _, rIdx) => {
      const ALIVE_CHANCE = 0.2;
      return (Math.random() < ALIVE_CHANCE) ? rowTotal + (1 << rIdx) : rowTotal;
    }, 0);
    return total.add(ethers.BigNumber.from(`0x${row.toString(16).padStart(4, "0")}${"".padStart(4 * idx, "0")}`));
  }, ethers.BigNumber.from("0"));
  return rows;
}

