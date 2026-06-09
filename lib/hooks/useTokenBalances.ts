"use client";

import * as React from "react";
import { formatUnits, type Address } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { erc20Abi } from "@/lib/abis";

export type TokenBalance = {
  raw: bigint;
  formatted: string;
  decimals: number;
};

function formatCompact(value: bigint, decimals: number): string {
  if (value === 0n) return "0";
  const n = Number(formatUnits(value, decimals));
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return n.toFixed(4).replace(/\.?0+$/, "");
  if (n >= 0.0001) return n.toFixed(6).replace(/\.?0+$/, "");
  return "<0.0001";
}

export function useTokenBalances(addresses: Address[]) {
  const { address: wallet } = useAccount();

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
      wallet
        ? unique.flatMap((token) => [
            {
              address: token,
              abi: erc20Abi,
              functionName: "balanceOf" as const,
              args: [wallet] as const
            },
            {
              address: token,
              abi: erc20Abi,
              functionName: "decimals" as const
            }
          ])
        : [],
    [unique, wallet]
  );

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: Boolean(wallet && unique.length > 0) }
  });

  const balances = React.useMemo(() => {
    const map = new Map<string, TokenBalance>();
    if (!data || !wallet) return map;

    for (let i = 0; i < unique.length; i++) {
      const balResult = data[i * 2];
      const decResult = data[i * 2 + 1];
      const raw = balResult?.status === "success" ? (balResult.result as bigint) : 0n;
      const decimals =
        decResult?.status === "success" ? Number(decResult.result as number) : 18;
      const addr = unique[i].toLowerCase();
      map.set(addr, {
        raw,
        decimals,
        formatted: formatCompact(raw, decimals)
      });
    }
    return map;
  }, [data, unique, wallet]);

  return { balances, isLoading, refetch, isConnected: Boolean(wallet) };
}
