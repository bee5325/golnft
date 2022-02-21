// Imports dependencies and set up http server
import "dotenv/config";
import express from 'express';
import { ethers } from 'ethers';
import cors from 'cors';

const port = 3000;

const app = express();
app.use(express.json());
app.use(cors());

// ethers
let signer = new ethers.Wallet(process.env.PRIVATE_KEY!);
let abiCoder = ethers.utils.defaultAbiCoder;

app.put("/board", (req, res) => {
  let {account, rows} = req.body;
  let initState = randomize(rows);
  let signature = signer.signMessage(abiCoder.encode(['uint256', 'address'], [initState, account]));
  res.send({ initState: initState.toHexString(), signature });
});

app.listen(port, () => {
  console.log(`Express is listening at http://localhost:${port}`);
});

function randomize(maxRows: number) {
  let rows = Array(maxRows).fill(0).reduce((total, _, idx) => {
    let row = Array(maxRows).fill(0).reduce((rowTotal, _, rIdx) => {
      const ALIVE_CHANCE = 0.2;
      return (Math.random() < ALIVE_CHANCE) ? rowTotal + (1 << rIdx) : rowTotal;
    }, 0);
    console.log({row, total});
    return total.add(ethers.BigNumber.from(`0x${row.toString(16).padStart(4, "0")}${"".padStart(4 * idx, "0")}`));
  }, ethers.BigNumber.from("0"));
  return rows;
}
