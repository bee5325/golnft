import { ethers } from "ethers";

// types
declare let window: any;
let ethereum = window.ethereum;
interface ProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}

export const useWallet = () => {
  let currentAccount = ref<string>("");
  let provider = new ethers.providers.Web3Provider(window.ethereum);

  async function connect() {
    await provider.send("eth_requestAccounts", []);
  }

  ethereum.on('accountsChanged', handleAccountsChanged);

  function handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      currentAccount.value = "";
    } else if (accounts[0] !== currentAccount.value) {
      currentAccount.value = accounts[0];
    }
  }

  let signer = computed(() => provider.getSigner());

  // check account connected on start
  ethereum
    .request({ method: 'eth_accounts' })
    .then(handleAccountsChanged)
    .catch((err: ProviderRpcError) => {
      console.error(err);
    });

  return {
    account: currentAccount,
    signer,
    connect,
  };
}
