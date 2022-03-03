<script setup lang="ts">
import { Ref, ComputedRef } from "vue";
import { useContract } from "../composables/contract";
import axios from "axios";
import { config } from "../config";

let account: Ref<string> = ref("");
let connect: () => Promise<void>;
let payToMint: (rows: number, initState: string, tokenURI: string, signature: string) => Promise<any>;
let _price: ComputedRef<Promise<string>>;
let walletDetected = ref(false);

// Ignored for SSG
if (typeof useContract !== "undefined") {
  ({ account, connect, price: _price, payToMint } = useContract());
  walletDetected.value = true;
}

function truncate(account: string) {
  return `${account.substring(0, 7)}...${account.substring(account.length-5)}`;
}

// Auto update price when connected
let price = ref<string>("?");
watchEffect(async () => {
  if (!_price || !account.value) {
    return;
  }

  price.value = await _price.value;
  if (price.value === "?") {
    notification.value = {
      type: "error",
      msg: `
        Error getting latest price for minting. Make sure you are connected to the correct network (Arbitrum).\n
        Contact admin if the issue persists.`
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
  if (rows.value < 3 || rows.value > 16) {
    return;
  }
  try {
    let resp = await axios.get(`${config.SERVER_URL}/minted/${rows.value}`);
    mintedCount.value = resp.data.rows;
  } catch (err) {
    console.log(err);
  }
});
let combinations = computed(() => {
  if (rows.value < 3 || rows.value > 16) {
    return "N/A";
  }
  return Math.pow(2,rows.value*rows.value)
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
  if (rows.value < 3 || rows.value > 16) {
    return;
  }
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

    console.log(rows.value, initState, newMeta.baseTokenUri, signature);
    // pay and mint on chain
    let res = await payToMint(rows.value, initState, newMeta.baseTokenUri, signature);
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
          notification.value = {
            type: "error",
            msg: "Unexpected error happend. Please try again later."
          };
          console.log(JSON.stringify(err));
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
let collectionStatus = ref<"loading" | "error" | "ready">("loading");
watch([account, initId], async () => {
  if (!account.value) {
    return;
  }

  collectionStatus.value = "loading";
  try {
    // wait for 2s for collections to be updated in database
    // wait is not perfect. Consider to use web socket if encountering issue
    await new Promise((res) => setTimeout(res, 2000));
    let col = (await axios.get(`${config.SERVER_URL}/collections/${account.value}`)).data;
    if (col) {
      collectionStatus.value = "ready";
      collections.value = col;
    }
  } catch (err) {
    collectionStatus.value = "error";
  }
});

onMounted(() => {
  // for no wallet
  if (!walletDetected.value) {
    notification.value = {
      type: "error",
      msg: "No wallet detected. Please install a wallet to continue",
    }
  }

  if (!walletDetected.value || !account.value) {
    collectionStatus.value = "ready";
  }
});
</script>

<template>
  <div>
    <Notification :type="notification.type" :msg="notification.msg" @clearNotification="clearNotification" />
    <h1 class="uppercase">Mint</h1>
    <button v-if="!account" class="btn" :disabled="connecting || !walletDetected" @click="connectWallet">Connect your wallet</button>
    <template v-else>
      <p>Account <span class="font-bold">{{truncate(account)}}</span></p>
      <div class="m-auto">
        <label>Number of rows (3 - 16)</label>
        <input type="number" v-model="rows" class="border-gray-300 border-1 border-solid px-2 py-1 m-2" min="3" max="16" />
      </div>
      <p>(<span class="font-bold">{{mintedCount}}</span> of {{combinations}} minted)</p>
      <button class="btn relative" :disabled="minting || price === '?'" @click="mint">
        Mint for {{ price }} ETH
        <eos-icons-loading v-if="minting" class="absolute left-full top-1/2 transform -translate-y-1/2 text-green-900 w-6 h-6 ml-2" />
      </button>
      <p class="font-bold break-words px-3">{{initId}}</p>
      <div class="grid grid-cols-1 md:grid-cols-3 items-center">
        <GOLBoard
          class="md:col-start-2"
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
    <div class="min-h-screen">
      <h1 class="font-bold text-green-600 text-2xl uppercase m-2">My collections ({{collections.length}})</h1>
      <Collections :collections="collections" :status="collectionStatus" />
    </div>
  </div>
</template>
