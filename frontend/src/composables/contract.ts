import { Ref } from "vue";
import { ethers } from "ethers";

declare let window: any;
interface Contract {
  account: Ref<string | undefined>;
  connect: () => Promise<void>;
  chainId: Ref<string>;
  switchChain: (chainId: string) => Promise<void>;
  payToMint: (
    rows: number,
    initState: string,
    tokenURI: string,
    signature: string
  ) => Promise<any>;
  price: Ref<string>;
  tokenIdOf: (rows: number, initState: string) => Promise<number>;
}

let useContract: () => Contract;

interface Network {
  chainId: string;
  chainName: string;
  rpcUrls: [string];
  blockExplorerUrls: [string];
  nativeCurrency: {
    symbol: string;
    decimals: number;
  };
}

if (typeof window !== "undefined" && window.ethereum) {
  // types
  let ethereum = window.ethereum;
  interface ProviderRpcError extends Error {
    message: string;
    code: number;
    data?: unknown;
  }

  const contractAbi = [
    {
      inputs: [],
      name: "getPrice",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "rows",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "initState",
          type: "uint256",
        },
        {
          internalType: "string",
          name: "_tokenUri",
          type: "string",
        },
        {
          internalType: "bytes",
          name: "signature",
          type: "bytes",
        },
      ],
      name: "payToMint",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "rows",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "initState",
          type: "uint256",
        },
      ],
      name: "tokenIdOf",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  useContract = () => {
    let currentAccount = ref<string>();
    let chainId = ref("0");
    let provider = new ethers.providers.Web3Provider(window.ethereum);
    let signer = provider.getSigner();
    let contractAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512"; // import.meta.env.VITE_CONTRACT_ADDRESS as string;
    let contract = ref(
      new ethers.Contract(contractAddress, contractAbi, signer)
    );

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", (_chainId: string) => {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      contract.value = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer
      );
      chainId.value = _chainId;
      console.log("HERE", _chainId);
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
      .request({ method: "eth_accounts" })
      .then(handleAccountsChanged)
      .catch((err: ProviderRpcError) => {
        console.error(err);
      });

    // get chain id on start
    provider
      .send("eth_chainId", [])
      .then((_chainId) => (chainId.value = _chainId));

    async function switchChain(chainId: string) {
      try {
        await provider.send("wallet_switchEthereumChain", [{ chainId }]);
      } catch (err) {
        if ((err as ProviderRpcError).code === 4902) {
          // network not added before
          await addNetwork(chainId);
          return;
        }
        console.log("Error switch chain", err);
      }
    }

    async function addNetwork(chainId: string) {
      const KNOWN_NETWORKS: Record<string, Network> = {
        "0xa4b1": {
          chainId: "0xA4B1",
          chainName: "Arbitrum One",
          rpcUrls: ["https://arb1.arbitrum.io/rpc"],
          blockExplorerUrls: ["https://arbiscan.io"],
          nativeCurrency: {
            symbol: "ETH",
            decimals: 18,
          },
        },
      };

      try {
        if (KNOWN_NETWORKS[chainId] === undefined) {
          throw new Error(`Unkown network for chainId ${chainId}`);
        }
        await provider.send("wallet_addEthereumChain", [
          KNOWN_NETWORKS[chainId],
        ]);
      } catch (err) {
        console.log("Error adding network", err);
      }
    }

    async function payToMint(
      rows: number,
      initState: string,
      tokenURI: string,
      signature: string
    ) {
      let latestPrice = await getPrice();
      if (!latestPrice) {
        throw new Error("Unable to get latest price");
      }
      let pay = await contract.value.payToMint(
        unref(rows),
        ethers.BigNumber.from(`0x${unref(initState)}`),
        tokenURI,
        signature,
        { value: ethers.utils.parseEther(latestPrice) }
      );
      return await pay.wait();
    }

    let price = ref("?");
    watchEffect(async () => (price.value = await getPrice()));
    async function getPrice() {
      try {
        return ethers.utils.formatEther(await contract.value.getPrice());
      } catch {
        return "?";
      }
    }

    async function tokenIdOf(rows: number, initState: string) {
      try {
        return await contract.value.tokenIdOf(
          rows,
          ethers.BigNumber.from(`0x${initState}`)
        );
      } catch (err) {
        console.log(err);
        return "?";
      }
    }

    return {
      account: currentAccount,
      connect,
      chainId,
      switchChain,
      payToMint,
      price,
      tokenIdOf,
    };
  };
}

export { useContract };
