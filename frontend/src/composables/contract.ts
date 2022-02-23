import { ethers } from "ethers";

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
  let contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  let contract = new ethers.Contract(
    contractAddress,
    contractAbi,
    signer
  );

  ethereum.on('accountsChanged', handleAccountsChanged);

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

  async function payToMint(rows: number, initState: string, signature: string) {
    let pay = await contract.payToMint(
      unref(rows),
      ethers.BigNumber.from(`0x${unref(initState)}`),
      signature,
      { value: ethers.utils.parseEther(await price.value) }
    );
    return await pay.wait();
  }

  let price = computed(async () => ethers.utils.formatEther(await contract.getPrice()));

  return {
    account: currentAccount,
    connect,
    payToMint,
    price,
  };
}
