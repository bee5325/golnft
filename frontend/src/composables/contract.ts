import { ethers } from "ethers";
import { config } from "../config";

// types
declare let window: any;
let ethereum = window.ethereum;
interface ProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}

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
        "internalType": "string",
        "name": "_tokenUri",
        "type": "string"
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

export const useContract = () => {
  let currentAccount = ref<string>("");
  let provider = new ethers.providers.Web3Provider(window.ethereum);
  let signer = provider.getSigner();
  let contractAddress = config.CONTRACT_ADDRESS;
  let contract = ref(new ethers.Contract(
    contractAddress,
    contractAbi,
    signer
  ));

  ethereum.on('accountsChanged', handleAccountsChanged);
  ethereum.on('chainChanged', () => {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    contract.value = new ethers.Contract(contractAddress, contractAbi, signer);
  });

  async function connect() {
    await provider.send("eth_requestAccounts", []);
  }

  function handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      currentAccount.value = "";
    } else if (accounts[0] !== currentAccount.value) {
      currentAccount.value = accounts[0];
    }
  }

  // check account connected on start
  ethereum
    .request({ method: 'eth_accounts' })
    .then(handleAccountsChanged)
    .catch((err: ProviderRpcError) => {
      console.error(err);
    });

  async function payToMint(rows: number, initState: string, tokenURI: string, signature: string) {
    let latestPrice = await price.value;
    if (!latestPrice) {
      throw new Error("Unable to get latest price");
    }
    console.log(await signer.getAddress());
    let pay = await contract.value.payToMint(
      unref(rows),
      ethers.BigNumber.from(`0x${unref(initState)}`),
      tokenURI,
      signature,
      { value: ethers.utils.parseEther(latestPrice) }
    );
    return await pay.wait();
  }

  let price = computed(async () => {
    try {
      return ethers.utils.formatEther(await contract.value.getPrice())
    } catch {
      return "?";
    }
  });

  return {
    account: currentAccount,
    connect,
    payToMint,
    price,
  };
}
