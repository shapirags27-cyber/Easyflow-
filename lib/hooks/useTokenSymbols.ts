"use client";

import * as React from "react";
import type { Address } from "viem";
import { useReadContracts } from "wagmi";
import { erc20Abi } from "@/lib/abis";

export function useTokenSymbols(addresses: Address[], enabled = true) {
  const unique = React.useMemo(() => {
    const seen = new Set<string>();
    return addresses.filter((a) => {
      const k = a.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [addresses]);

  const contracts = React.useMemo(
    () =>
      unique.map((address) => ({
        address,
        abi: erc20Abi,
        functionName: "symbol" as const
      })),
    [unique]
  );

  const { data } = useReadContracts({
    contracts,
    query: { enabled: enabled && unique.length > 0 }
  });

  return React.useMemo(() => {
    const map = new Map<string, string>();
    if (!data) return map;
    unique.forEach((addr, i) => {
      const row = data[i];
      if (row?.status === "success" && row.result) {
        map.set(addr.toLowerCase(), String(row.result));
      }
    });
    return map;
  }, [data, unique]);
}
