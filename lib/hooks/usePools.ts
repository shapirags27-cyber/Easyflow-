"use client";

import * as React from "react";
import { type Address } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contracts } from "@/lib/contracts";
import { getTokenAddress } from "@/lib/tokens";
import { ammRouterAbi, erc20Abi } from "@/lib/abis";

export function usePools(token0Sym = "OPN", token1Sym = "tUSDT") {
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

  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
  const isPending = isWritePending || isConfirming;

  const addLiquidity = React.useCallback(
    async (amount0: bigint, amount1: bigint) => {
      if (!address) return;
      writeContract({
        address: contracts.ammRouter,
        abi: ammRouterAbi,
        functionName: "addLiquidity",
        args: [token0, token1, amount0, amount1, address]
      });
    },
    [address, token0, token1, writeContract]
  );

  const approveAndAdd = React.useCallback(
    async (amount0: bigint, amount1: bigint) => {
      writeContract({
        address: token0,
        abi: erc20Abi,
        functionName: "approve",
        args: [contracts.ammRouter, amount0]
      });
      await addLiquidity(amount0, amount1);
    },
    [addLiquidity, token0, writeContract]
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
