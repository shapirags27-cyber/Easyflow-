import { createPublicClient, http } from "viem";
import { iopnTestnet } from "@/lib/chains";

export function getPublicClient() {
  return createPublicClient({
    chain: iopnTestnet,
    transport: http(iopnTestnet.rpcUrls.default.http[0])
  });
}
