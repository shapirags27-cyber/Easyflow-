"use client";

import { http, createConfig } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { iopnTestnet } from "@/lib/chains";

export const config = createConfig({
  chains: [iopnTestnet],
  connectors: [metaMask()],
  transports: {
    [iopnTestnet.id]: http(iopnTestnet.rpcUrls.default.http[0])
  },
  ssr: true
});

