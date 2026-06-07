import { defineChain } from "viem";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 984);
const rpcUrl = process.env.NEXT_PUBLIC_IOPN_RPC ?? "https://testnet-rpc.iopn.tech";

export const iopnTestnet = defineChain({
  id: chainId,
  name: "IOPN Testnet",
  network: "iopn-testnet",
  nativeCurrency: {
    name: "OPN",
    symbol: "OPN",
    decimals: 18
  },
  rpcUrls: {
    default: { http: [rpcUrl] }
  },
  blockExplorers: {
    default: {
      name: "IOPN Explorer",
      url: "https://testnet-explorer.iopn.tech"
    }
  }
});
