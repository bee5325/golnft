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
let contractAddress = ref("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
let minting = ref(false);
async function mint() {
  // register start of minting to disable duplication
  minting.value = true;

  try {
    let { data: newBoard } = await axios.put("http://localhost:3000/board", {rows: rows.value, account: account.value});
    console.log(newBoard.initState);
    /* let token = new ethers.Contract( */
    /*   contractAddress.value, */
    /*   contractAbi, */
    /*   signer.value */
    /* ); */
    /* let pay = await token.payToMint(3, { value: 100000000000000 }); */
    /* let res = await pay.wait(); */
    /* notification.value = { */
    /*   msg: `Transaction confirmed!\nTransaction ID: ${res.transactionHash}`, */
    /*   type: "info" */
    /* }; */
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
      }
    }
  }

  minting.value = false;
}
</script>

<template>
  <div>
    <Notification :type="notification.type" :msg="notification.msg" @clearNotification="clearNotification" />
    <p class="inline-block">Contract address</p><input class="font-bold mx-2" v-model="contractAddress" />
    <button v-if="account === ''" class="btn" @click="connect">Connect your wallet</button>
    <p v-else>Account <span class="font-bold">{{account}}</span></p>
    <p>
      <label>Number of rows</label>
      <input type="number" v-model="rows" class="border-gray-300 border-1 border-solid px-2 py-1 m-2" min="3" max="16" />
    </p>
    <button class="btn" :disabled="minting" @click="mint">Mint</button>
  </div>
</template>
