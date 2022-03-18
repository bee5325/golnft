// Imports dependencies and set up http server
import "dotenv/config";
import express from "express";
import { ethers } from "ethers";
import cors from "cors";
import { Collection, Minted, TokenMeta } from "./database";
import { genGIF, genMeta } from "./genGIF";
import nodemailer from "nodemailer";

const port = process.env.PORT || 3000;
let contract: ethers.Contract;

const app = express();
app.use(express.json());
app.use(cors());

interface PendingTransaction {
  meta: TokenMeta;
  signature: string;
}
let pendingTransactions: Record<string, PendingTransaction> = {};

app.put("/board", async (req, res) => {
  let { account, rows } = req.body;

  // this is to avoid duplication of work and prevent exploit by mint repeatedly without finish payment
  if (pendingTransactionsFound(account, rows)) {
    let pending = getPendingTransaction(account, rows);
    let { meta, signature } = pending;

    // double check if state exists
    if (
      !(await contract.initStateExists(
        rows,
        ethers.BigNumber.from(`0x${meta.initState}`)
      ))
    ) {
      res.send({ initState: meta.initState, meta, signature });
      return;
    }
  }

  // check if rows supported
  if (rows < 3 || rows > 16) {
    res.status(400).send({ msg: `Rows must be between 3 and 16` });
    return;
  }

  // check if all taken
  let mintedDocs = await Minted.find({ rows }).select("initState");
  let minted = [
    ...mintedDocs.map((m) => m.initState),
    ...getPendingTransactionsForRows(rows),
  ];
  if (minted.length === Math.pow(2, rows * rows)) {
    res
      .status(400)
      .send({ msg: `All possibilities were already minted for ${rows} rows` });
    return;
  }

  // get a non repeated init state
  let initState = randomize(rows);
  let initStateStr = bigNumToInitState(initState, rows);
  while (minted.includes(initStateStr)) {
    initState = randomize(rows);
    initStateStr = bigNumToInitState(initState, rows);
  }
  let { gifUrl, stepCount, loop } = await genGIF(initStateStr);
  let meta: TokenMeta = {
    name: `GOL #${initStateStr}`,
    date: Date.now(),
    description: "Art created based on rules of Conway's Game of Life.",
    initState: initStateStr,
    rows: initStateStr.length / 4,
    image: gifUrl,
    externalUrl: `${process.env.SITE_URL}/${initState}`,
    attributes: [
      { trait_types: "Step count", value: stepCount },
      { trait_types: "Loop", value: loop ? "Yes" : "No" },
    ],
  };

  let baseTokenUri = await genMeta(initStateStr, meta);
  meta.baseTokenUri = baseTokenUri;

  // calculate signature to make sure it comes from the server itself
  let signature = await getSignature(rows, initState, account);

  // Register transaction so that DB can be updated when getting confirmation from blockchain.
  // Check dbUpdatePending() for details
  addPendingTransactions(account, rows, {
    meta,
    signature,
  });

  res.send({ initState: initStateStr, signature, meta });
});

app.get("/board/:initState", async (req, res) => {
  let { initState } = req.params;
  let meta = await Minted.findOne({ initState });
  res.send(meta);
});

app.get("/collections/:account", async (req, res) => {
  let { account } = req.params;
  let col = await Collection.findOne({ account });
  res.send(col ? col.collections : []);
});

app.get("/minted/:row", async (req, res) => {
  let { row } = req.params;
  let rows = await Minted.count({ rows: row });
  res.send({ rows });
});

// setup
for (let key of ["PRIVATE_KEY", "CONTRACT_ADDRESS", "NETWORK"]) {
  if (!process.env[key]) {
    throw new Error(`${key} is not set in environment variables`);
  }
}
app.listen(port, () => {
  console.log(`Express is listening at http://localhost:${port}`);

  let abi = [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "rows",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "initState",
          type: "uint256",
        },
      ],
      name: "Minted",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "rows",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "initState",
          type: "uint256",
        },
      ],
      name: "initStateExists",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];
  // update db for pending transactions
  let provider = ethers.getDefaultProvider(process.env.NETWORK);
  contract = new ethers.Contract(process.env.CONTRACT_ADDRESS!, abi, provider);
  contract.on("Minted", dbUpdatePending);
});

app.post("/feedback", (req, res) => {
  let { email, feedback } = req.body;
  try {
    let transporter = nodemailer.createTransport({
      service: process.env.MAIL_PROVIDER,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
    transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: "You got a new feedback",
      text: `Feedback from ${email}:\n\n${feedback}`,
    });
  } catch (err) {
    console.log(err);
  }
  res.send("OK");
});

/**
 *
 * helper functions
 *
 **/
async function getSignature(
  rows: number,
  initState: ethers.BigNumber,
  address: string
) {
  let signer = new ethers.Wallet(process.env.PRIVATE_KEY!);
  let abiCoder = ethers.utils.defaultAbiCoder;

  return await signer.signMessage(
    ethers.utils.arrayify(
      ethers.utils.keccak256(
        abiCoder.encode(["uint", "uint", "address"], [rows, initState, address])
      )
    )
  );
}

function randomize(maxRows: number) {
  let rows = Array(maxRows)
    .fill(0)
    .reduce((total, _, idx) => {
      let row = Array(maxRows)
        .fill(0)
        .reduce((rowTotal, _, rIdx) => {
          const ALIVE_CHANCE = 0.2;
          return Math.random() < ALIVE_CHANCE
            ? rowTotal + (1 << rIdx)
            : rowTotal;
        }, 0);
      return total.add(
        ethers.BigNumber.from(
          `0x${row.toString(16).padStart(4, "0")}${"".padStart(4 * idx, "0")}`
        )
      );
    }, ethers.BigNumber.from("0"));
  return rows;
}

function bigNumToInitState(bigNum: ethers.BigNumber, maxRows: number): string {
  return bigNum
    .toHexString()
    .replace("0x", "")
    .padStart(maxRows * 4, "0");
}

function getPendingTransaction(
  account: string,
  rows: number
): PendingTransaction {
  return pendingTransactions[`${account}.${rows}`];
}

function getPendingTransactionsForRows(rows: number): string[] {
  let pendingForRows = Object.values(pendingTransactions).filter(
    (pending) => pending.meta.rows === rows
  );
  return pendingForRows.map((pending) => pending.meta.initState);
}

function pendingTransactionsFound(account: string, rows: number): boolean {
  return pendingTransactions[`${account}.${rows}`] !== undefined;
}

function addPendingTransactions(
  account: string,
  rows: number,
  transaction: PendingTransaction
) {
  pendingTransactions[`${account}.${rows}`] = transaction;
}

async function dbUpdatePending(
  tokenId: ethers.BigNumber,
  account: string,
  rows: ethers.BigNumber,
  initState: ethers.BigNumber
) {
  account = account.toLowerCase();
  let initStateStr = bigNumToInitState(initState, rows.toNumber());
  let transactionId = `${account}.${rows}`;
  let transaction = pendingTransactions[transactionId];

  if (!transaction) {
    console.error(
      `Pending transaction for account ${account} rows ${rows} is not found`
    );
    return;
  }

  // update database (collection)
  let col = await Collection.findOne({ account });
  let oldCol = col ? col.collections : [];
  let newCol = {
    account,
    collections: [...oldCol, initStateStr],
  };
  await Collection.replaceOne({ account }, newCol, { upsert: true });

  // update database (minted)
  let meta = { ...transaction.meta, tokenId };
  let newMinted = new Minted(meta);
  await newMinted.save();

  delete pendingTransactions[transactionId];
}
