"use client";

import * as React from "react";
import { type Address } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contracts } from "@/lib/contracts";
import { getTokenAddress } from "@/lib/tokens";
import { ammRouterAbi, erc20Abi } from "@/lib/abis";

function poolDeadline() {
  return BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
}

export function usePools(token0Sym = "WOPN", token1Sym = "tUSDT") {
  const { address } = useAccount();
  const token0 = getTokenAddress(token0Sym);
  const token1 = getTokenAddress(token1Sym);

  const { data: decimals0 } = useReadContract({
    address: token0,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: token0 !== "0x0000000000000000000000000000000000000000" }
  });
  const { data: decimals1 } = useReadContract({
    address: token1,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: token1 !== "0x0000000000000000000000000000000000000000" }
  });

  const { data: allowance0 } = useReadContract({
    address: token0,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, contracts.ammRouter] : undefined,
    query: { enabled: Boolean(address && token0 !== "0x0000000000000000000000000000000000000000") }
  });
  const { data: allowance1 } = useReadContract({
    address: token1,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, contracts.ammRouter] : undefined,
    query: { enabled: Boolean(address && token1 !== "0x0000000000000000000000000000000000000000") }
  });

  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
  const isPending = isWritePending || isConfirming;

  const addLiquidity = React.useCallback(
    (amount0: bigint, amount1: bigint) => {
      if (!address) return;
      writeContract({
        address: contracts.ammRouter,
        abi: ammRouterAbi,
        functionName: "addLiquidity",
        args: [token0, token1, amount0, amount1, 0n, 0n, address, poolDeadline()]
      });
    },
    [address, token0, token1, writeContract]
  );

  const approveAndAdd = React.useCallback(
    async (amount0: bigint, amount1: bigint) => {
      if (!address) return;
      const a0 = allowance0 ?? 0n;
      const a1 = allowance1 ?? 0n;

      if (a0 < amount0) {
        writeContract({
          address: token0,
          abi: erc20Abi,
          functionName: "approve",
          args: [contracts.ammRouter, amount0]
        });
        return;
      }
      if (a1 < amount1) {
        writeContract({
          address: token1,
          abi: erc20Abi,
          functionName: "approve",
          args: [contracts.ammRouter, amount1]
        });
        return;
      }

      addLiquidity(amount0, amount1);
    },
    [addLiquidity, address, allowance0, allowance1, token0, token1, writeContract]
  );

  const canAdd =
    token0.toLowerCase() !== token1.toLowerCase() &&
    token0 !== "0x0000000000000000000000000000000000000000" &&
    token1 !== "0x0000000000000000000000000000000000000000";

  return {
    token0Sym,
    token1Sym,
    token0,
    token1,
    decimals0: decimals0 ? Number(decimals0) : 18,
    decimals1: decimals1 ? Number(decimals1) : 18,
    addLiquidity: approveAndAdd,
    isPending,
    canAdd
  };
}
