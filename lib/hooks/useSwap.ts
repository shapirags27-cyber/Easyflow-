"use client";

import * as React from "react";
import { formatUnits, type Address } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contracts } from "@/lib/contracts";
import { getTokenAddress } from "@/lib/tokens";
import { ammRouterAbi, erc20Abi } from "@/lib/abis";

type TokenRef = { symbol: string; address: Address; decimals: number };

function swapDeadline() {
  return BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
}

export function useSwap() {
  const { address } = useAccount();
  const [tokenInSym, setTokenInSym] = React.useState("WOPN");
  const [tokenOutSym, setTokenOutSym] = React.useState("tUSDT");
  const [quoteError, setQuoteError] = React.useState<string | null>(null);

  const tokenInAddr = getTokenAddress(tokenInSym);
  const tokenOutAddr = getTokenAddress(tokenOutSym);

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

  const swapPath = React.useMemo(
    () => [tokenIn.address, tokenOut.address] as Address[],
    [tokenIn.address, tokenOut.address]
  );

  const refreshQuote = React.useCallback(
    async (amountIn: bigint) => {
      if (
        amountIn === 0n ||
        !contracts.ammRouter ||
        tokenIn.address === "0x0000000000000000000000000000000000000000" ||
        tokenOut.address === "0x0000000000000000000000000000000000000000" ||
        tokenIn.address.toLowerCase() === tokenOut.address.toLowerCase()
      ) {
        setQuotedOut(0n);
        setQuoteError(null);
        return;
      }

      const { createPublicClient, http } = await import("viem");
      const { iopnTestnet } = await import("@/lib/chains");
      const client = createPublicClient({
        chain: iopnTestnet,
        transport: http(iopnTestnet.rpcUrls.default.http[0])
      });

      try {
        const amounts = await client.readContract({
          address: contracts.ammRouter,
          abi: ammRouterAbi,
          functionName: "getAmountsOut",
          args: [amountIn, swapPath]
        });
        const out = amounts[amounts.length - 1] ?? 0n;
        setQuotedOut(out);
        setQuoteError(out === 0n ? "No liquidity for this pair." : null);
      } catch {
        setQuotedOut(0n);
        setQuoteError("No quote — check pair liquidity or token selection.");
      }
    },
    [swapPath, tokenIn.address, tokenOut.address]
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
      if (!address) return;
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
        args: [amountIn, minOut, swapPath, address, swapDeadline()]
      });
    },
    [address, allowance, quotedOut, swapPath, tokenIn.address, writeContract]
  );

  const formattedOut = quotedOut ? formatUnits(quotedOut, tokenOut.decimals) : "0";

  const canSwap =
    tokenIn.address.toLowerCase() !== tokenOut.address.toLowerCase() && quotedOut > 0n;

  const setTokenInOut = (a: string, b: string) => {
    setTokenInSym(a);
    setTokenOutSym(b);
  };

  return {
    tokenIn,
    tokenOut,
    setTokenInOut,
    quote: {
      formattedOut,
      priceText: quoteError
        ? quoteError
        : quotedOut === 0n
          ? "Enter amount to see quote"
          : `~ ${formattedOut} ${tokenOut.symbol} (est.)`,
      canSwap,
      quoteError
    },
    refreshQuote,
    doSwap,
    isPending
  };
}
