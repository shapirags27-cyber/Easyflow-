"use client";

import * as React from "react";
import { formatUnits, type Address } from "viem";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { iopnTestnet } from "@/lib/chains";
import { erc20Abi } from "@/lib/abis";
import { isWopnAddress, WOPN_ADDRESS } from "@/lib/tokens";

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

  const needsNative = unique.some((a) => isWopnAddress(a));
  const erc20Addrs = unique.filter((a) => !isWopnAddress(a));

  const { data: nativeBal } = useBalance({
    address: wallet,
    chainId: iopnTestnet.id,
    query: { enabled: Boolean(wallet && needsNative) }
  });

  const contracts = React.useMemo(
    () =>
      wallet
        ? unique.flatMap((token) => {
            if (isWopnAddress(token)) {
              return [
                {
                  address: WOPN_ADDRESS,
                  abi: erc20Abi,
                  functionName: "balanceOf" as const,
                  args: [wallet] as const
                }
              ];
            }
            return [
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
            ];
          })
        : [],
    [unique, wallet]
  );

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: Boolean(wallet && unique.length > 0) }
  });

  const balances = React.useMemo(() => {
    const map = new Map<string, TokenBalance>();
    if (!wallet) return map;

    let dataIdx = 0;
    for (const addr of unique) {
      const key = addr.toLowerCase();

      if (isWopnAddress(addr)) {
        const wrapped =
          data?.[dataIdx]?.status === "success" ? (data[dataIdx].result as bigint) : 0n;
        dataIdx += 1;
        const native = nativeBal?.value ?? 0n;
        const total = native + wrapped;
        map.set(key, {
          raw: total,
          decimals: 18,
          formatted: formatCompact(total, 18)
        });
        continue;
      }

      const balResult = data?.[dataIdx];
      const decResult = data?.[dataIdx + 1];
      dataIdx += 2;
      const raw = balResult?.status === "success" ? (balResult.result as bigint) : 0n;
      const decimals =
        decResult?.status === "success" ? Number(decResult.result as number) : 18;
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
