"use client";

import * as React from "react";
import { formatUnits, type Address } from "viem";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { iopnTestnet } from "@/lib/chains";
import { erc20Abi } from "@/lib/abis";
import { isNativeOpn, isWopnAddress, WOPN_ADDRESS } from "@/lib/tokens";

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

  const needsNativeOpn = unique.some((a) => isNativeOpn(a));

  const { data: nativeBal } = useBalance({
    address: wallet,
    chainId: iopnTestnet.id,
    query: { enabled: Boolean(wallet && needsNativeOpn) }
  });

  const contracts = React.useMemo(() => {
    if (!wallet) return [];
    const list: {
      address: Address;
      abi: typeof erc20Abi;
      functionName: "balanceOf" | "decimals";
      args?: readonly [Address];
    }[] = [];

    for (const token of unique) {
      if (isNativeOpn(token)) continue;
      list.push({
        address: isWopnAddress(token) ? WOPN_ADDRESS : token,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [wallet]
      });
      list.push({
        address: isWopnAddress(token) ? WOPN_ADDRESS : token,
        abi: erc20Abi,
        functionName: "decimals"
      });
    }
    return list;
  }, [unique, wallet]);

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: Boolean(wallet && contracts.length > 0) }
  });

  const balances = React.useMemo(() => {
    const map = new Map<string, TokenBalance>();
    if (!wallet) return map;

    let dataIdx = 0;
    for (const addr of unique) {
      const key = addr.toLowerCase();

      if (isNativeOpn(addr)) {
        const raw = nativeBal?.value ?? 0n;
        map.set(key, {
          raw,
          decimals: 18,
          formatted: formatCompact(raw, 18)
        });
        continue;
      }

      const balEntry = data?.[dataIdx] as { status: string; result?: unknown } | undefined;
      const decEntry = data?.[dataIdx + 1] as { status: string; result?: unknown } | undefined;
      dataIdx += 2;
      const raw =
        balEntry?.status === "success" && typeof balEntry.result === "bigint"
          ? balEntry.result
          : 0n;
      const decimals =
        decEntry?.status === "success" && typeof decEntry.result === "number"
          ? decEntry.result
          : 18;
      map.set(key, {
        raw,
        decimals,
        formatted: formatCompact(raw, decimals)
      });
    }

    return map;
  }, [data, nativeBal?.value, unique, wallet]);

  return { balances, isLoading, refetch, isConnected: Boolean(wallet) };
}
