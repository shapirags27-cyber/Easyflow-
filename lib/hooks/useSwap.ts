"use client";

import * as React from "react";
import { formatUnits, type Address } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contracts } from "@/lib/contracts";
import { getTokenByAddress } from "@/lib/tokens";
import { ammRouterAbi, erc20Abi } from "@/lib/abis";

type TokenRef = { symbol: string; address: Address; decimals: number };

const WOPN = "0xBc022C9dEb5AF250A526321d16Ef52E39b4DBD84" as Address;
const TUSDT = "0x3e01b4d892E0D0A219eF8BBe7e260a6bc8d9B31b" as Address;

function swapDeadline() {
  return BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
}

function useTokenMeta(address: Address) {
  const known = getTokenByAddress(address);

  const { data: onChainSymbol } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: "symbol",
    query: { enabled: address !== "0x0000000000000000000000000000000000000000" }
  });
  const { data: decimals } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: address !== "0x0000000000000000000000000000000000000000" }
  });

  const symbol =
    known?.symbol ??
    (onChainSymbol as string | undefined) ??
    `${address.slice(0, 6)}…${address.slice(-4)}`;

  return {
    symbol,
    decimals: decimals ? Number(decimals) : 18
  };
}

export function useSwap() {
  const { address } = useAccount();
  const [tokenInAddress, setTokenInAddress] = React.useState<Address>(WOPN);
  const [tokenOutAddress, setTokenOutAddress] = React.useState<Address>(TUSDT);
  const [quoteError, setQuoteError] = React.useState<string | null>(null);

  const inMeta = useTokenMeta(tokenInAddress);
  const outMeta = useTokenMeta(tokenOutAddress);

  const tokenIn: TokenRef = {
    symbol: inMeta.symbol,
    address: tokenInAddress,
    decimals: inMeta.decimals
  };
  const tokenOut: TokenRef = {
    symbol: outMeta.symbol,
    address: tokenOutAddress,
    decimals: outMeta.decimals
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

  const setTokenIn = (addr: Address) => setTokenInAddress(addr);
  const setTokenOut = (addr: Address) => setTokenOutAddress(addr);

  const swapTokenPositions = () => {
    setTokenInAddress(tokenOutAddress);
    setTokenOutAddress(tokenInAddress);
  };

  return {
    tokenIn,
    tokenOut,
    setTokenIn,
    setTokenOut,
    swapTokenPositions,
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
