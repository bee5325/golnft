// Imports dependencies and set up http server
import "dotenv/config";
import express from 'express';
import { ethers } from 'ethers';
import cors from 'cors';
import { Collection, Taken } from './database';

const port = 3000;

const app = express();
app.use(express.json());
app.use(cors());

app.put("/board", async (req, res) => {
  let { account, rows } = req.body;

  // check if rows supported
  if (rows < 3 || rows > 16) {
    res.status(400).send({ msg: `Rows must be between 3 and 16` });
    return;
  }

  // check if all taken
  let takenEntry = await Taken.findOne({ rows });
  let taken: Array<string> = takenEntry ? takenEntry.initStates : [];
  const takenCount = taken.length;
  if (takenCount === Math.pow(2, rows*rows)) {
    res.status(400).send({ msg: `All possibilities were already taken for ${rows} rows` });
    return;
  }

  // get a non repeated init state
  let initState = randomize(rows);
  let initStateStr = bigNumToInitState(initState, rows);
  while (taken && taken.includes(initStateStr)) {
    initState = randomize(rows);
    initStateStr = bigNumToInitState(initState, rows);
  }
  taken.push(initStateStr);
  await Taken.replaceOne(
    { rows },
    { rows, initStates: taken },
    { upsert: true }
  );

  // calculate signature to make sure it comes from the server itself
  let signature = await getSignature(rows, initState, account);
  let col = await Collection.findOne({ account });
  let oldCol = col ? col.collections : [];
  let newCol = {
    account,
    collections: [...oldCol, initStateStr]
  };
  await Collection.replaceOne({ account }, newCol, { upsert: true });
  res.send({ initState: initStateStr, signature });
});

app.get("/collections/:account", async (req, res) => {
  let { account } = req.params;
  let col = await Collection.findOne({ account });
  res.send(col ? col.collections : []);
});

app.listen(port, async () => {
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

function bigNumToInitState(bigNum: ethers.BigNumber, maxRows: number): string {
  return bigNum.toHexString().replace("0x", "").padStart(maxRows*4, "0");
}
