<script lang="ts">
export default { name: 'Mint' };
</script>

<script setup lang="ts">
import { useContract } from "../composables/contract";
import { ethers } from "ethers";
import axios from "axios";

// takes care of the contract
let { account, connect, price: _price, payToMint } = useContract();

let price = ref("0.0001");
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

// contract interaction
let rows = ref(3);
let generatedRows = ref(3);
let initId = ref<string | null>(null);
let minting = ref(false);
async function mint() {
  // register start of minting to disable duplication
  minting.value = true;

  try {
    // first get init state from server
    let { data: { initState, signature } } = await axios.put("http://localhost:3000/board", {rows: rows.value, account: account.value});

    // pay and mint on chain
    let pay = await payToMint(
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
    generatedRows.value = rows.value;
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
      <button class="btn" :disabled="minting" @click="mint">Mint for {{ price }} ETH</button>
      <p class="font-bold" v-if="initId !== null">{{initId}}</p>
      <GOLBoard
        v-if="initId !== null"
        :toggle="false"
        :initId="initId"
        :max-rows="generatedRows"
      />
    </div>
  </div>
</template>
