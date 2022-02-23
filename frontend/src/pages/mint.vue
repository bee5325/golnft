<script lang="ts">
export default { name: 'Mint' };
</script>

<script setup lang="ts">
import { useWallet } from "../composables/wallet";
import { ethers } from "ethers";
import axios from "axios";

const contractAbi = [
  {
    "inputs": [],
    "name": "getPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "rows",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "initState",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "payToMint",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
];

// takes care of the wallet
let { account, signer, connect } = useWallet();

// notification
interface Notification {
  msg: string;
  type: "none" | "error" | "info";
};
let notification = ref<Notification>({msg: "", type: "none"});
function clearNotification() {
  notification.value = {msg: "", type: "none"};
}

// contract interaction
let rows = ref(3);
let initId = ref<string | null>(null);
let contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
let minting = ref(false);
async function mint() {
  // register start of minting to disable duplication
  minting.value = true;

  try {
    // first get init state from server
    let { data: { initState, signature } } = await axios.put("http://localhost:3000/board", {rows: rows.value, account: account.value});

    // pay and mint on chain
    let token = new ethers.Contract(
      contractAddress,
      contractAbi,
      signer.value
    );
    let pay = await token.payToMint(
      rows.value,
      ethers.BigNumber.from(`0x${initState}`),
      signature,
      { value: 100000000000000 }
    );
    let res = await pay.wait();
    notification.value = {
      msg: `Transaction confirmed!\nTransaction ID: ${res.transactionHash}`,
      type: "info"
    };

    // display
    initId.value = initState;
  } catch (err: any) {
    if (err.code) {
      switch (err.code) {
        case -32603: {
          let errMsg = err.data
            ? err.data.message
            : "Unexpected error happened. Please reset your wallet account and try again";
          notification.value = {
            type: "error",
            msg: errMsg.replace("Error: VM Exception while processing transaction: ", "")
          };
          break;
        }
        case 4001: {
          notification.value = {
            type: "error",
            msg: "Transaction rejected by user"
          };
          break;
        }
        default:
          console.log(err);
          break;
      }
    } else if (err.response?.status === 400 && err.response?.data?.msg) {
      notification.value = {
        type: "error",
        msg: err.response.data.msg,
      };
    } else {
      console.log(err);
    }
  }

  minting.value = false;
}
</script>

<template>
  <div>
    <Notification :type="notification.type" :msg="notification.msg" @clearNotification="clearNotification" />
    <button v-if="!account" class="btn" @click="connect">Connect your wallet</button>
    <div v-else>
      <p>Account <span class="font-bold">{{account}}</span></p>
      <label>Number of rows</label>
      <input type="number" v-model="rows" class="border-gray-300 border-1 border-solid px-2 py-1 m-2" min="3" max="16" />
      <button class="btn" :disabled="minting" @click="mint">Mint</button>
      <p class="font-bold" v-if="initId !== null">{{initId}}</p>
      <GOLBoard
        v-if="initId !== null"
        :initId="initId"
        :max-rows="rows"
      />
    </div>
  </div>
</template>
