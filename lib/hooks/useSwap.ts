"use client";

import * as React from "react";
import { formatUnits, type Address } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contracts } from "@/lib/contracts";
import { ammRouterAbi, erc20Abi } from "@/lib/abis";

type TokenRef = { symbol: "A" | "B"; address: Address; decimals: number };

export function useSwap() {
  const { address } = useAccount();
  const [tokenInSym, setTokenInSym] = React.useState<"A" | "B">("A");
  const [tokenOutSym, setTokenOutSym] = React.useState<"A" | "B">("B");

  const tokenInAddr = (tokenInSym === "A" ? contracts.tokenA : contracts.tokenB) as Address;
  const tokenOutAddr = (tokenOutSym === "A" ? contracts.tokenA : contracts.tokenB) as Address;

  const { data: inDecimals } = useReadContract({
    address: tokenInAddr,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: tokenInAddr !== "0x0000000000000000000000000000000000000000" }
  });
  const { data: outDecimals } = useReadContract({
    address: tokenOutAddr,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: tokenOutAddr !== "0x0000000000000000000000000000000000000000" }
  });

  const tokenIn: TokenRef = {
    symbol: tokenInSym,
    address: tokenInAddr,
    decimals: inDecimals ? Number(inDecimals) : 18
  };
  const tokenOut: TokenRef = {
    symbol: tokenOutSym,
    address: tokenOutAddr,
    decimals: outDecimals ? Number(outDecimals) : 18
  };

  const [quotedOut, setQuotedOut] = React.useState<bigint>(0n);

  const refreshQuote = React.useCallback(
    async (amountIn: bigint) => {
      if (
        amountIn === 0n ||
        !contracts.ammRouter ||
        tokenIn.address === "0x0000000000000000000000000000000000000000" ||
        tokenOut.address === "0x0000000000000000000000000000000000000000"
      ) {
        setQuotedOut(0n);
        return;
      }
      const { createPublicClient, http } = await import("viem");
      const { iopnTestnet } = await import("@/lib/chains");
      const client = createPublicClient({
        chain: iopnTestnet,
        transport: http(iopnTestnet.rpcUrls.default.http[0])
      });
      try {
        const out = await client.readContract({
          address: contracts.ammRouter,
          abi: ammRouterAbi,
          functionName: "getAmountOut",
          args: [amountIn, tokenIn.address, tokenOut.address]
        });
        setQuotedOut(out as bigint);
      } catch {
        setQuotedOut(0n);
      }
    },
    [tokenIn.address, tokenOut.address]
  );

  const { data: allowance } = useReadContract({
    address: tokenIn.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, contracts.ammRouter] : undefined,
    query: { enabled: Boolean(address && contracts.ammRouter) }
  });

  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
  const isPending = isWritePending || isConfirming;

  const doSwap = React.useCallback(
    async (amountIn: bigint, slippageBps: number) => {
      const out = quotedOut;
      const minOut = out - (out * BigInt(slippageBps)) / 10_000n;
      const currentAllowance = allowance ?? 0n;
      if (currentAllowance < amountIn) {
        writeContract({
          address: tokenIn.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [contracts.ammRouter, amountIn]
        });
        return;
      }

      writeContract({
        address: contracts.ammRouter,
        abi: ammRouterAbi,
        functionName: "swapExactTokensForTokens",
        args: [amountIn, minOut, tokenIn.address, tokenOut.address, (address ?? contracts.ammRouter) as Address]
      });
    },
    [address, allowance, quotedOut, tokenIn.address, tokenOut.address, writeContract]
  );

  const formattedOut = quotedOut ? formatUnits(quotedOut, tokenOut.decimals) : "0";
  const priceText =
    quotedOut === 0n ? "—" : `~ ${formattedOut} ${tokenOut.symbol} for 1 ${tokenIn.symbol} (est.)`;

  const canSwap = tokenInSym !== tokenOutSym;

  const setTokenInOut = (a: string, b: string) => {
    const ai = (a === "B" ? "B" : "A") as "A" | "B";
    const bi = (b === "A" ? "A" : "B") as "A" | "B";
    setTokenInSym(ai);
    setTokenOutSym(bi);
  };

  return {
    tokenIn,
    tokenOut,
    setTokenInOut,
    quote: {
      formattedOut,
      priceText,
      canSwap
    },
    refreshQuote,
    doSwap,
    isPending
  };
}

