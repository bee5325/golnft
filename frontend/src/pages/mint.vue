<script setup lang="ts">
import { useContract } from "../composables/contract";
import axios from "axios";

useHead({
  title: 'Mint',
})

// takes care of the contract
let { account, connect, price: _price, payToMint } = useContract();

let price = ref<string>("?");
onActivated(async () => {
  price.value = await _price.value;
});

// notification
interface Notification {
  msg: string;
  type: "none" | "error" | "info";
};
let notification = ref<Notification>({msg: "", type: "none"});
function clearNotification() {
  notification.value = {msg: "", type: "none"};
}

// show minted count
let rows = ref(3);
let mintedCount = ref(0);
watchEffect(async () => {
  try {
    let resp = await axios.get(`http://localhost:3000/minted/${rows.value}`);
    mintedCount.value = resp.data.rows;
  } catch (err) {
    console.log(err);
  }
});

// contract interaction
let initId = ref<string | null>(null);
let minting = ref(false);
let connecting = ref(false);

async function connectWallet() {
  connecting.value = true;
  try {
    await connect();
  } finally {
    connecting.value = false;
  }
}

async function mint() {
  // register start of minting to disable duplication
  minting.value = true;

  try {
    // first get init state from server
    let { data: { initState, signature } } = await axios.put(
      "http://localhost:3000/board",
      {rows: rows.value, account: account.value}
    );

    // pay and mint on chain
    let res = await payToMint(rows.value, initState, signature);
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
    } else if (err.message === "Network Error") {
      notification.value = {
        type: "error",
        msg: "Network error. Please try again later",
      };
    } else {
      notification.value = {
        type: "error",
        msg: "Unexpected error happened. Please try again later",
      }
      console.trace(err);
      console.log(JSON.stringify(err));
    }
  }

  minting.value = false;
}

// collections
let collections = ref([]);
watch([account, initId], async () => {
  if (!account.value) {
    return;
  }

  let col = (await axios.get(`http://localhost:3000/collections/${account.value}`)).data;
  if (col) {
    collections.value = col;
  }
});
</script>

<template>
  <div>
    <Notification :type="notification.type" :msg="notification.msg" @clearNotification="clearNotification" />
    <h1 class="font-bold text-green-600 text-2xl uppercase m-2">Mint</h1>
    <button v-if="!account" class="btn" :disabled="connecting" @click="connectWallet">Connect your wallet</button>
    <div v-else>
      <p>Account <span class="font-bold">{{account}}</span></p>
      <label>Number of rows</label>
      <div>
        <input type="number" v-model="rows" class="border-gray-300 border-1 border-solid px-2 py-1 m-2" min="3" max="16" />
        <span>(<span class="font-bold">{{mintedCount}}</span> of {{Math.pow(2,rows*rows)}} minted)</span>
      </div>
      <button class="btn" :disabled="minting || price === '?'" @click="mint">Mint for {{ price }} ETH</button>
      <p class="font-bold" v-if="initId !== null">{{initId}}</p>
      <GOLBoard
        v-if="initId !== null"
        :toggle="false"
        :initId="initId"
        :autorun="true"
      />
    </div>
    <hr class="m-4">
    <h1 class="font-bold text-green-600 text-2xl uppercase m-2">My collections ({{collections.length}})</h1>
    <Collections :collections="collections" />
  </div>
</template>
