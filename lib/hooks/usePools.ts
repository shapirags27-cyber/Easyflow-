"use client";

import * as React from "react";
import { type Address } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contracts } from "@/lib/contracts";
import { ammRouterAbi, erc20Abi } from "@/lib/abis";

export function usePools() {
  const { address } = useAccount();

  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
  const isPending = isWritePending || isConfirming;

  const addLiquidity = React.useCallback(
    async (amountA: bigint, amountB: bigint) => {
      if (!address) return;
      writeContract({
        address: contracts.ammRouter,
        abi: ammRouterAbi,
        functionName: "addLiquidity",
        args: [contracts.tokenA, contracts.tokenB, amountA, amountB, address]
      });
    },
    [address, writeContract]
  );

  const approveAndAdd = React.useCallback(
    async (amountA: bigint, amountB: bigint) => {
      writeContract({
        address: contracts.tokenA,
        abi: erc20Abi,
        functionName: "approve",
        args: [contracts.ammRouter, amountA]
      });
      // User may need second tx for B + addLiquidity in production
      await addLiquidity(amountA, amountB);
    },
    [addLiquidity, writeContract]
  );

  return { addLiquidity: approveAndAdd, isPending };
}
