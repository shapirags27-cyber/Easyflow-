"use client";

import { http, createConfig } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { iopnTestnet } from "@/lib/chains";

export const config = createConfig({
  chains: [iopnTestnet],
  connectors: [injected(), metaMask()],
  transports: {
    [iopnTestnet.id]: http(iopnTestnet.rpcUrls.default.http[0])
  },
  ssr: true
});