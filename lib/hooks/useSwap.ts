"use client";

import * as React from "react";
import { formatUnits, getAddress, maxUint256, type Address } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from "wagmi";
import { contracts } from "@/lib/contracts";
import {
  isWopnAddress,
  resolveTokenSymbol,
  TUSDT_ADDRESS,
  WOPN_ADDRESS
} from "@/lib/tokens";
import { iopnTestnet } from "@/lib/chains";
import { fetchSwapQuote } from "@/lib/swap-quote";
import { ammRouterAbi, erc20Abi } from "@/lib/abis";

type TokenRef = { symbol: string; address: Address; decimals: number };

const WOPN = WOPN_ADDRESS;
const TUSDT = TUSDT_ADDRESS;

function swapDeadline() {
  return BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
}

function checksumPath(path: Address[]): Address[] {
  return path.map((a) => getAddress(a));
}

function useTokenMeta(address: Address) {
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

  const symbol = resolveTokenSymbol(address, onChainSymbol as string | undefined);

  return {
    symbol,
    decimals: decimals ? Number(decimals) : 18
  };
}

type PendingSwap = {
  amountIn: bigint;
  slippageBps: number;
};

export function useSwap() {
  const { address } = useAccount();
  const [tokenInAddress, setTokenInAddress] = React.useState<Address>(WOPN);
  const [tokenOutAddress, setTokenOutAddress] = React.useState<Address>(TUSDT);
  const [swapPath, setSwapPath] = React.useState<Address[]>([WOPN, TUSDT]);
  const [quotedOut, setQuotedOut] = React.useState<bigint>(0n);
  const [quoteError, setQuoteError] = React.useState<string | null>(null);
  const [isQuoting, setIsQuoting] = React.useState(false);
  const [pendingSwap, setPendingSwap] = React.useState<PendingSwap | null>(null);

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

  const { writeContract, data: hash, error: writeError, isPending: isWritePending } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash
  });
  const isPending = isWritePending || isConfirming;

  const quotedOutRef = React.useRef(quotedOut);
  const swapPathRef = React.useRef(swapPath);
  quotedOutRef.current = quotedOut;
  swapPathRef.current = swapPath;

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
        setSwapPath([tokenIn.address, tokenOut.address]);
        setQuoteError(null);
        return;
      }

      setIsQuoting(true);
      try {
        const params = new URLSearchParams({
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          amountWei: amountIn.toString()
        });

        const res = await fetch(`/api/quote?${params.toString()}`);
        const data = (await res.json()) as {
          amountOut?: string;
          path?: Address[];
          error?: string | null;
        };

        if (res.ok && data.amountOut && data.amountOut !== "0" && data.path?.length) {
          setQuotedOut(BigInt(data.amountOut));
          setSwapPath(checksumPath(data.path));
          setQuoteError(null);
          return;
        }

        const { createPublicClient, http } = await import("viem");
        const { iopnTestnet } = await import("@/lib/chains");
        const client = createPublicClient({
          chain: iopnTestnet,
          transport: http(iopnTestnet.rpcUrls.default.http[0])
        });

        const fallback = await fetchSwapQuote(client, tokenIn.address, tokenOut.address, amountIn);
        if (fallback.ok) {
          setQuotedOut(fallback.amountOut);
          setSwapPath(checksumPath(fallback.path));
          setQuoteError(null);
        } else {
          setQuotedOut(0n);
          setSwapPath([tokenIn.address, tokenOut.address]);
          setQuoteError(data.error ?? fallback.reason);
        }
      } catch {
        setQuotedOut(0n);
        setSwapPath([tokenIn.address, tokenOut.address]);
        setQuoteError("Could not fetch quote — check RPC connection.");
      } finally {
        setIsQuoting(false);
      }
    },
    [tokenIn.address, tokenOut.address]
  );

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenIn.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, contracts.ammRouter] : undefined,
    query: { enabled: Boolean(address && contracts.ammRouter) }
  });

  const { data: balanceIn, refetch: refetchBalanceIn } = useReadContract({
    address: tokenIn.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) }
  });

  const { data: nativeOpnBal, refetch: refetchNativeOpn } = useBalance({
    address,
    chainId: iopnTestnet.id,
    query: { enabled: Boolean(address && isWopnAddress(tokenIn.address)) }
  });

  const balanceInRaw = React.useMemo(() => {
    const erc20 = balanceIn ?? 0n;
    if (isWopnAddress(tokenIn.address)) {
      return erc20 + (nativeOpnBal?.value ?? 0n);
    }
    return erc20;
  }, [balanceIn, nativeOpnBal?.value, tokenIn.address]);

  const runSwapTx = React.useCallback(
    (amountIn: bigint, slippageBps: number) => {
      if (!address) return;
      const out = quotedOutRef.current;
      if (out === 0n) return;
      const minOut = out - (out * BigInt(slippageBps)) / 10_000n;
      writeContract({
        address: contracts.ammRouter,
        abi: ammRouterAbi,
        functionName: "swapExactTokensForTokens",
        args: [
          amountIn,
          minOut,
          checksumPath(swapPathRef.current),
          address,
          swapDeadline()
        ]
      });
    },
    [address, writeContract]
  );

  React.useEffect(() => {
    if (!isConfirmed || !pendingSwap) return;

    const { amountIn, slippageBps } = pendingSwap;
    setPendingSwap(null);
    void refetchAllowance();
    runSwapTx(amountIn, slippageBps);
  }, [isConfirmed, pendingSwap, refetchAllowance, runSwapTx]);

  React.useEffect(() => {
    if (isConfirmed && !pendingSwap) {
      void refetchBalanceIn();
      void refetchNativeOpn();
      void refetchAllowance();
    }
  }, [isConfirmed, pendingSwap, refetchBalanceIn, refetchNativeOpn, refetchAllowance]);

  const doSwap = React.useCallback(
    (amountIn: bigint, slippageBps: number) => {
      if (!address || amountIn === 0n || quotedOut === 0n) return;

      const walletBal = balanceInRaw;
      const wrappedOnly = balanceIn ?? 0n;
      if (walletBal < amountIn) {
        setQuoteError(`Insufficient ${tokenIn.symbol} balance.`);
        return;
      }
      if (isWopnAddress(tokenIn.address) && wrappedOnly < amountIn) {
        setQuoteError(
          `Need wrapped OPN to swap. You have ${tokenIn.symbol} native — wrap to WOPN first.`
        );
        return;
      }

      const currentAllowance = allowance ?? 0n;
      if (currentAllowance < amountIn) {
        setPendingSwap({ amountIn, slippageBps });
        writeContract({
          address: tokenIn.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [contracts.ammRouter, maxUint256]
        });
        return;
      }

      runSwapTx(amountIn, slippageBps);
    },
    [
      address,
      allowance,
      balanceInRaw,
      balanceIn,
      quotedOut,
      runSwapTx,
      tokenIn.address,
      tokenIn.symbol,
      writeContract
    ]
  );

  const formattedOut = quotedOut ? formatUnits(quotedOut, tokenOut.decimals) : "0";
  const balanceInFormatted = formatUnits(balanceInRaw, tokenIn.decimals);

  const canSwap =
    tokenIn.address.toLowerCase() !== tokenOut.address.toLowerCase() && quotedOut > 0n;

  const setTokenIn = (addr: Address) => setTokenInAddress(addr);
  const setTokenOut = (addr: Address) => setTokenOutAddress(addr);

  const swapTokenPositions = () => {
    setTokenInAddress(tokenOutAddress);
    setTokenOutAddress(tokenInAddress);
    setSwapPath([tokenOutAddress, tokenInAddress]);
  };

  const needsApproval = (amountIn: bigint) => (allowance ?? 0n) < amountIn;

  return {
    tokenIn,
    tokenOut,
    balanceInRaw,
    balanceInFormatted,
    setTokenIn,
    setTokenOut,
    swapTokenPositions,
    quote: {
      formattedOut,
      priceText: quoteError
        ? quoteError
        : isQuoting
          ? "Fetching quote…"
          : quotedOut === 0n
            ? "Enter amount to see quote"
            : `~ ${formattedOut} ${tokenOut.symbol} (est.)`,
      canSwap,
      quoteError
    },
    refreshQuote,
    doSwap,
    isPending,
    pendingApproval: pendingSwap !== null,
    needsApproval,
    swapError: writeError?.message ?? null
  };
}
