<script setup lang="ts">
import { useContract } from "../composables/contract";
import axios from "axios";
import { config } from "../config";

// takes care of the contract
let { account, connect, price: _price, payToMint } = useContract();

let price = ref<string>("?");
onActivated(async () => {
  price.value = await _price.value;
  if (price.value === "?") {
    notification.value = {
      type: "error",
      msg: "Error getting latest price for minting. Please try again later, and contact admin if the issue persists."
    }
  }
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
let initId = ref<string>("????????????");
let meta = ref(null);
let rows = ref(3);
let mintedCount = ref(0);
watch([rows, initId], async () => {
  try {
    let resp = await axios.get(`${config.SERVER_URL}/minted/${rows.value}`);
    mintedCount.value = resp.data.rows;
  } catch (err) {
    console.log(err);
  }
});

// contract interaction
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

watch(rows, () => {
  if (initId.value.includes("?")) {
    initId.value = "".padStart(rows.value*4, "?");
  }
});

async function mint() {
  // register start of minting to disable duplication
  minting.value = true;

  try {
    // first get init state from server
    let { data: { initState, meta: newMeta, signature } } = await axios.put(
      `${config.SERVER_URL}/board`,
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
    meta.value = newMeta;
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
let collectionError = ref(false);
watch([account, initId], async () => {
  if (!account.value) {
    return;
  }

  try {
    let col = (await axios.get(`${config.SERVER_URL}/collections/${account.value}`)).data;
    if (col) {
      collectionError.value = false;
      collections.value = col;
    }
  } catch (err) {
    collectionError.value = true;
  }
});
</script>

<template>
  <div>
    <Notification :type="notification.type" :msg="notification.msg" @clearNotification="clearNotification" />
    <h1 class="font-bold text-green-600 text-2xl uppercase m-2">Mint</h1>
    <button v-if="!account" class="btn" :disabled="connecting" @click="connectWallet">Connect your wallet</button>
    <template v-else>
      <p>Account <span class="font-bold">{{account}}</span></p>
      <div class="w-390px m-auto">
        <label>Number of rows</label>
        <input type="number" v-model="rows" class="border-gray-300 border-1 border-solid px-2 py-1 m-2" min="3" max="16" />
      </div>
      <p>(<span class="font-bold">{{mintedCount}}</span> of {{Math.pow(2,rows*rows)}} minted)</p>
      <button class="btn relative" :disabled="minting || price === '?'" @click="mint">
        Mint for {{ price }} ETH
        <eos-icons-loading v-if="minting" class="absolute left-full top-1/2 transform -translate-y-1/2 text-green-900 w-6 h-6 ml-2" />
      </button>
      <p class="font-bold">{{initId}}</p>
      <div class="grid grid-cols-3 items-center">
        <GOLBoard
          class="col-start-2"
          :width="500"
          :height="500"
          :toggle="false"
          :initId="initId"
          :autorun="true"
        />
        <GOLInfo v-if="meta" :meta="meta" :loading="false" />
      </div>
    </template>
    <hr class="m-4">
    <h1 class="font-bold text-green-600 text-2xl uppercase m-2">My collections ({{collections.length}})</h1>
    <Collections :collections="collections" :error="collectionError" />
  </div>
</template>
