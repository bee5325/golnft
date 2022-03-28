<script lang="ts">
const ARBITRUM_ONE = "0xa4b1";
</script>

<script setup lang="ts">
import type { Ref } from "vue";
import { useContract } from "../composables/contract";
import axios from "axios";

let account: Ref<string | undefined> = ref();
let connect: () => Promise<void>;
let payToMint: (
  rows: number,
  initState: string,
  tokenURI: string,
  signature: string
) => Promise<any>;
let tokenIdOf: (rows: number, initState: string) => Promise<number>;
let walletDetected = ref(false);
let price = ref<string>("?");
let chainId = ref("0");
let switchChain: (chainId: string) => Promise<void>;

// Ignored for SSG
if (typeof useContract !== "undefined") {
  ({ account, connect, chainId, switchChain, price, payToMint, tokenIdOf } =
    useContract());
  walletDetected.value = true;
}

function truncate(account: string | undefined) {
  if (!account) {
    return "";
  }
  return `${account.substring(0, 7)}...${account.substring(
    account.length - 5
  )}`;
}

// notification
type Notification = {
  msg: string;
  type: "none" | "err_arbitrum" | "err_price" | "err_general" | "info_general";
};

let notification = ref<Notification>({ msg: "", type: "none" });
let notificationType = computed(() =>
  notification.value.type.startsWith("err_")
    ? "error"
    : notification.value.type.startsWith("info_")
    ? "info"
    : "none"
);
function clearNotification() {
  notification.value = {
    msg: "",
    type: "none",
  };
}

// Detect network changes and auto update price
watchEffect(() => {
  // make sure wallet connected
  if (!account.value) {
    return;
  }

  // make sure network is arbitrum
  if (chainId.value !== ARBITRUM_ONE) {
    notification.value = {
      msg: "",
      type: "err_arbitrum",
    };
    return;
  }

  // get price (add small delay to prevent flickering)
  setTimeout(() => {
    if (price.value === "?") {
      notification.value = {
        msg: "",
        type: "err_price",
      };
      return;
    }
  }, 1000);

  clearNotification();
});

// Smooth transition when page loaded
let loading = ref(true);
onMounted(() => {
  setTimeout(() => (loading.value = false), 1000);
});

// show minted count
let initId = ref<string>("????????????");
let meta = ref(null);
let rows = ref(3);
let mintedCount = ref(0);
onMounted(async () => {
  mintedCount.value = await getMintedCount(rows.value);
});
watch([rows, initId], async () => {
  if (rows.value < 3 || rows.value > 16) {
    return;
  }
  mintedCount.value = await getMintedCount(rows.value);
});
async function getMintedCount(rows: number): Promise<number> {
  try {
    let resp = await axios.get(
      `${import.meta.env.VITE_SERVER_URL}/minted/${rows}`
    );
    return resp.data.rows;
  } catch (err) {
    console.log(err);
    return 0;
  }
}
let combinations = computed(() => {
  if (rows.value < 3 || rows.value > 16) {
    return "N/A";
  }
  return Math.pow(2, rows.value * rows.value);
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
    initId.value = "".padStart(rows.value * 4, "?");
  }
});

async function mint() {
  // register start of minting to disable duplication
  minting.value = true;

  try {
    // first get init state from server
    let {
      data: { initState, meta: newMeta, signature },
    } = await axios.put(`${import.meta.env.VITE_SERVER_URL}/board`, {
      rows: rows.value,
      account: account.value,
    });

    // pay and mint on chain
    let res = await payToMint(
      rows.value,
      initState,
      newMeta.baseTokenUri,
      signature
    );
    notification.value = {
      msg: `Transaction confirmed!\nTransaction ID: ${res.transactionHash}`,
      type: "info_general",
    };

    // display
    initId.value = initState;
    newMeta.tokenId = await tokenIdOf(rows.value, initState);
    meta.value = newMeta;
  } catch (err: any) {
    if (err.code) {
      switch (err.code) {
        case -32603: {
          let errMsg = err.data
            ? err.data.message
            : "Unexpected error happened. Please reset your wallet account and try again";
          notification.value = {
            type: "err_general",
            msg: errMsg.replace(
              "Error: VM Exception while processing transaction: ",
              ""
            ),
          };
          break;
        }
        case 4001: {
          notification.value = {
            type: "err_general",
            msg: "Transaction rejected by user",
          };
          break;
        }
        default:
          notification.value = {
            type: "err_general",
            msg: "Unexpected error happend. Please try again later.",
          };
          console.log(JSON.stringify(err));
          break;
      }
    } else if (err.response?.status === 400 && err.response?.data?.msg) {
      notification.value = {
        type: "err_general",
        msg: err.response.data.msg,
      };
    } else if (err.message === "Network Error") {
      notification.value = {
        type: "err_general",
        msg: "Network error. Please try again later",
      };
    } else {
      notification.value = {
        type: "err_general",
        msg: "Unexpected error happened. Please try again later",
      };
      console.trace(err);
      console.log(JSON.stringify(err));
    }
  }

  minting.value = false;
}

// collections
let collections = ref([]);
let collectionStatus = ref<"not-loaded" | "loading" | "error" | "ready">(
  "not-loaded"
);
watch([account, initId], async () => {
  let revealed = !initId.value.includes("?");
  if (
    !account.value ||
    (collectionStatus.value !== "not-loaded" && !revealed)
  ) {
    return;
  }

  refreshCollections();
});
async function refreshCollections() {
  collectionStatus.value = "loading";
  try {
    // wait for 2s for collections to be updated in database
    // wait is not perfect. Consider to use web socket if encountering issue
    await new Promise((res) => setTimeout(res, 2000));
    let col = (
      await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/collections/${account.value}`
      )
    ).data;
    if (col) {
      collectionStatus.value = "ready";
      collections.value = col;
    }
  } catch (err) {
    collectionStatus.value = "error";
  }
}

onMounted(() => {
  // for no wallet
  if (!walletDetected.value) {
    notification.value = {
      type: "err_general",
      msg: "No wallet detected. Please install a wallet to continue",
    };
  }
});
</script>

<template>
  <div>
    <Notification
      :type="notificationType"
      :msg="notification.msg"
      @clearNotification="clearNotification"
    >
      <span v-if="notification.type === 'err_arbitrum'">
        You are not connected to Arbitrum One.<br />
        Click <a href="#" @click.prevent="switchChain(ARBITRUM_ONE)">here</a> to
        connect.
      </span>
      <span v-else-if="notification.type === 'err_price'">
        Error getting latest price for minting. Make sure you are connected to
        Arbitrum network.<br />
        Click <router-link to="help">here</router-link> for instructions.
      </span>
    </Notification>

    <div id="mint">
      <h1 class="uppercase">
        Mint
        <router-link to="help">
          <carbon-help
            class="w-6 absolute text-green-800 opacity-50 ml-2 hover:text-green-400 transition-colors cursor-pointer"
          ></carbon-help>
        </router-link>
      </h1>

      <transition-group
        mode="out-in"
        enter-from-class="transform scale-y-0 opacity-0"
        leave-to-class="transform scale-y-0 opacity-0"
        move-class="transition-transform duration-300 ease-out"
        enter-active-class="transition-all origin-top duration-500"
        leave-active-class="transition-all origin-top duration-500 absolute left-1/2 -translate-x-1/2"
      >
        <eos-icons-loading
          v-if="loading"
          key="loading"
          class="text-green-900 w-10 h-10"
        />
        <button
          v-else-if="account === ''"
          key="not-connect"
          class="btn"
          :disabled="connecting || !walletDetected"
          @click="connectWallet"
        >
          Connect your wallet
        </button>
        <div v-else-if="account !== undefined" key="connected">
          <p>
            Account <span class="font-bold">{{ truncate(account) }}</span>
          </p>
          <div class="m-auto">
            <label>Number of rows (3 - 16)</label>
            <input
              type="number"
              v-model="rows"
              class="border-gray-300 border-1 border-solid px-2 py-1 m-2"
              min="3"
              max="16"
            />
          </div>
          <p>
            (<span class="font-bold">{{ mintedCount }}</span> of
            {{ combinations }} minted)
          </p>
          <button
            class="btn relative"
            :disabled="minting || price === '?'"
            @click="mint"
          >
            Mint for {{ price }} ETH
            <eos-icons-loading
              v-if="minting"
              class="absolute left-full top-1/2 transform -translate-y-1/2 text-green-900 w-6 h-6 ml-2"
            />
          </button>
          <p class="font-bold break-words px-3">ID: {{ initId }}</p>
          <div
            class="grid grid-cols-1 md:grid-cols-3 items-center justify-items-center md:justify-items-stretch"
          >
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
        </div>
      </transition-group>
    </div>

    <hr class="m-4" />

    <div class="min-h-screen">
      <h1
        id="collections"
        class="font-bold text-green-600 text-2xl uppercase m-2"
      >
        My collections ({{ collections.length }})
        <carbon-renew
          class="text-green-900 w-5 align-middle ml-2 hover:text-green-400 cursor-pointer"
          :class="{
            'text-gray-500 hover:text-gray-500': collectionStatus === 'loading',
          }"
          @click="refreshCollections"
        ></carbon-renew>
      </h1>
      <Collections :collections="collections" :status="collectionStatus" />
    </div>
  </div>
</template>
