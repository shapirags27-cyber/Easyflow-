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
  isNativeOpn,
  NATIVE_OPN_ADDRESS,
  resolveTokenSymbol,
  toErc20Address,
  TUSDT_ADDRESS,
  WOPN_ADDRESS
} from "@/lib/tokens";
import { iopnTestnet } from "@/lib/chains";
import { fetchSwapQuote } from "@/lib/swap-quote";
import { ammRouterAbi, erc20Abi, wopnAbi } from "@/lib/abis";

type TokenRef = { symbol: string; address: Address; decimals: number };

const TUSDT = TUSDT_ADDRESS;

function swapDeadline() {
  return BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
}

function checksumPath(path: Address[]): Address[] {
  return path.map((a) => getAddress(a));
}

function formatSwapError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("user rejected") || lower.includes("user denied")) {
    return "Transaction cancelled.";
  }
  if (lower.includes("insufficient funds")) {
    return "Insufficient balance for gas or swap amount.";
  }
  const details = message.match(/Details:\s*([^\n]+)/i);
  if (details?.[1]) return details[1].trim();
  const reason = message.match(/Reason:\s*([^\n]+)/i);
  if (reason?.[1]) return reason[1].trim();
  if (message.length > 100) return `${message.slice(0, 100)}…`;
  return message;
}

function useTokenMeta(address: Address) {
  const erc20Addr = toErc20Address(address);

  const { data: onChainSymbol } = useReadContract({
    address: erc20Addr,
    abi: erc20Abi,
    functionName: "symbol",
    query: {
      enabled:
        erc20Addr !== "0x0000000000000000000000000000000000000000" && !isNativeOpn(address)
    }
  });
  const { data: decimals } = useReadContract({
    address: erc20Addr,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: erc20Addr !== "0x0000000000000000000000000000000000000000" }
  });

  const symbol = resolveTokenSymbol(address, onChainSymbol as string | undefined);

  return {
    symbol,
    decimals: decimals ? Number(decimals) : 18
  };
}

type PendingSwap =
  | { kind: "wrap"; amountIn: bigint; slippageBps: number }
  | { kind: "approve"; amountIn: bigint; slippageBps: number; unwrapAfter: boolean }
  | { kind: "swap"; amountIn: bigint; slippageBps: number; wopnBefore: bigint; unwrapAfter: boolean }
  | { kind: "unwrap"; amount: bigint };

export function useSwap() {
  const { address } = useAccount();
  const [tokenInAddress, setTokenInAddress] = React.useState<Address>(NATIVE_OPN_ADDRESS);
  const [tokenOutAddress, setTokenOutAddress] = React.useState<Address>(TUSDT);
  const [swapPath, setSwapPath] = React.useState<Address[]>([WOPN_ADDRESS, TUSDT]);
  const [quotedOut, setQuotedOut] = React.useState<bigint>(0n);
  const [quoteError, setQuoteError] = React.useState<string | null>(null);
  const [isQuoting, setIsQuoting] = React.useState(false);
  const [pendingSwap, setPendingSwap] = React.useState<PendingSwap | null>(null);
  const [swapError, setSwapError] = React.useState<string | null>(null);

  const erc20In = toErc20Address(tokenInAddress);
  const erc20Out = toErc20Address(tokenOutAddress);

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

  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWritePending,
    reset: resetWrite
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isReceiptError,
    error: receiptError
  } = useWaitForTransactionReceipt({ hash });
  const isPending = isWritePending || isConfirming;

  const clearSwapError = React.useCallback(() => {
    setSwapError(null);
    resetWrite();
  }, [resetWrite]);

  React.useEffect(() => {
    if (!writeError) return;
    setSwapError(formatSwapError(writeError.message));
    setPendingSwap(null);
    resetWrite();
  }, [writeError, resetWrite]);

  React.useEffect(() => {
    if (!isReceiptError || !receiptError) return;
    setSwapError(formatSwapError(receiptError.message));
    setPendingSwap(null);
    resetWrite();
  }, [isReceiptError, receiptError, resetWrite]);

  React.useEffect(() => {
    if (!swapError) return;
    const id = window.setTimeout(() => setSwapError(null), 8000);
    return () => window.clearTimeout(id);
  }, [swapError]);

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
        setSwapPath([erc20In, erc20Out]);
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
          setSwapPath([erc20In, erc20Out]);
          setQuoteError(data.error ?? fallback.reason);
        }
      } catch {
        setQuotedOut(0n);
        setSwapPath([erc20In, erc20Out]);
        setQuoteError("Could not fetch quote — check RPC connection.");
      } finally {
        setIsQuoting(false);
      }
    },
    [erc20In, erc20Out, tokenIn.address, tokenOut.address]
  );

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: erc20In,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, contracts.ammRouter] : undefined,
    query: { enabled: Boolean(address && contracts.ammRouter) }
  });

  const { data: wrappedBalance, refetch: refetchWrappedBalance } = useReadContract({
    address: WOPN_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) }
  });

  const { data: nativeOpnBal, refetch: refetchNativeOpn } = useBalance({
    address,
    chainId: iopnTestnet.id,
    query: { enabled: Boolean(address && isNativeOpn(tokenInAddress)) }
  });

  // ERC20 balance for the selected input token
  const { data: tokenInErc20Bal, refetch: refetchTokenInBal } = useReadContract({
    address: erc20In,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && !isNativeOpn(tokenInAddress))
    }
  });

  const inputBalance = React.useMemo(() => {
    if (isNativeOpn(tokenInAddress)) {
      return nativeOpnBal?.value ?? 0n;
    }
    if (tokenInAddress === WOPN_ADDRESS) {
      return wrappedBalance ?? 0n;
    }
    return tokenInErc20Bal ?? 0n;
  }, [nativeOpnBal?.value, tokenInAddress, tokenInErc20Bal, wrappedBalance]);

  const spendableForSwap = inputBalance;

  const unwrapAfterSwap = isNativeOpn(tokenOutAddress);

  const runSwapTx = React.useCallback(
    (amountIn: bigint, slippageBps: number) => {
      if (!address) return;
      const out = quotedOutRef.current;
      if (out === 0n) return;
      const minOut = out - (out * BigInt(slippageBps)) / 10_000n;
      setPendingSwap({
        kind: "swap",
        amountIn,
        slippageBps,
        wopnBefore: wrappedBalance ?? 0n,
        unwrapAfter: unwrapAfterSwap
      });
      writeContract({
        address: contracts.ammRouter,
        abi: ammRouterAbi,
        functionName: "swapExactTokensForTokens",
        args: [amountIn, minOut, checksumPath(swapPathRef.current), address, swapDeadline()]
      });
    },
    [address, unwrapAfterSwap, wrappedBalance, writeContract]
  );

  const continueAfterWrap = React.useCallback(
    (amountIn: bigint, slippageBps: number) => {
      const currentAllowance = allowance ?? 0n;
      if (currentAllowance < amountIn) {
        setPendingSwap({ kind: "approve", amountIn, slippageBps, unwrapAfter: unwrapAfterSwap });
        writeContract({
          address: WOPN_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [contracts.ammRouter, maxUint256]
        });
        return;
      }
      runSwapTx(amountIn, slippageBps);
    },
    [allowance, runSwapTx, unwrapAfterSwap, writeContract]
  );

  React.useEffect(() => {
    if (!isConfirmed || !pendingSwap) return;

    if (pendingSwap.kind === "wrap") {
      const { amountIn, slippageBps } = pendingSwap;
      setPendingSwap(null);
      void refetchWrappedBalance();
      void refetchAllowance();
      continueAfterWrap(amountIn, slippageBps);
      return;
    }

    if (pendingSwap.kind === "approve") {
      const { amountIn, slippageBps } = pendingSwap;
      setPendingSwap(null);
      runSwapTx(amountIn, slippageBps);
      return;
    }

    if (pendingSwap.kind === "swap") {
      const { wopnBefore, unwrapAfter } = pendingSwap;
      setPendingSwap(null);
      void refetchWrappedBalance();
      void refetchNativeOpn();
      void refetchTokenInBal();
      void refetchAllowance();

      if (unwrapAfter) {
        void (async () => {
          const { data: wopnNow } = await refetchWrappedBalance();
          const received =
            wopnNow !== undefined && wopnNow > wopnBefore ? wopnNow - wopnBefore : 0n;
          if (received > 0n) {
            setPendingSwap({ kind: "unwrap", amount: received });
            writeContract({
              address: WOPN_ADDRESS,
              abi: wopnAbi,
              functionName: "withdraw",
              args: [received]
            });
          }
        })();
      }
      return;
    }

    if (pendingSwap.kind === "unwrap") {
      setPendingSwap(null);
      void refetchWrappedBalance();
      void refetchNativeOpn();
    }
  }, [
    continueAfterWrap,
    isConfirmed,
    pendingSwap,
    refetchAllowance,
    refetchNativeOpn,
    refetchTokenInBal,
    refetchWrappedBalance,
    runSwapTx,
    wrappedBalance,
    writeContract
  ]);

  const doSwap = React.useCallback(
    (amountIn: bigint, slippageBps: number) => {
      if (!address || amountIn === 0n || quotedOut === 0n) return;

      setQuoteError(null);
      setSwapError(null);
      resetWrite();

      if (spendableForSwap < amountIn) {
        setQuoteError(`Insufficient ${tokenIn.symbol} balance.`);
        return;
      }

      if (isNativeOpn(tokenInAddress)) {
        const wrapped = wrappedBalance ?? 0n;
        const wrapAmount = amountIn > wrapped ? amountIn - wrapped : 0n;
        if (wrapAmount > 0n) {
          setPendingSwap({ kind: "wrap", amountIn, slippageBps });
          writeContract({
            address: WOPN_ADDRESS,
            abi: wopnAbi,
            functionName: "deposit",
            value: wrapAmount
          });
          return;
        }
        const currentAllowance = allowance ?? 0n;
        if (currentAllowance < amountIn) {
          setPendingSwap({
            kind: "approve",
            amountIn,
            slippageBps,
            unwrapAfter: unwrapAfterSwap
          });
          writeContract({
            address: WOPN_ADDRESS,
            abi: erc20Abi,
            functionName: "approve",
            args: [contracts.ammRouter, maxUint256]
          });
          return;
        }
        runSwapTx(amountIn, slippageBps);
        return;
      }

      if (inputBalance < amountIn) {
        setQuoteError(`Insufficient ${tokenIn.symbol} balance.`);
        return;
      }

      const swapAmount = amountIn;
      const currentAllowance = allowance ?? 0n;
      if (currentAllowance < swapAmount) {
        setPendingSwap({
          kind: "approve",
          amountIn: swapAmount,
          slippageBps,
          unwrapAfter: unwrapAfterSwap
        });
        writeContract({
          address: erc20In,
          abi: erc20Abi,
          functionName: "approve",
          args: [contracts.ammRouter, maxUint256]
        });
        return;
      }

      runSwapTx(swapAmount, slippageBps);
    },
    [
      address,
      allowance,
      erc20In,
      inputBalance,
      quotedOut,
      runSwapTx,
      spendableForSwap,
      tokenIn.symbol,
      tokenInAddress,
      unwrapAfterSwap,
      wrappedBalance,
      writeContract,
      resetWrite
    ]
  );

  const formattedOut = quotedOut ? formatUnits(quotedOut, tokenOut.decimals) : "0";
  const balanceInFormatted = formatUnits(spendableForSwap, tokenIn.decimals);

  const canSwap =
    tokenIn.address.toLowerCase() !== tokenOut.address.toLowerCase() && quotedOut > 0n;

  const setTokenIn = (addr: Address) => {
    setSwapError(null);
    resetWrite();
    setTokenInAddress(addr);
  };
  const setTokenOut = (addr: Address) => {
    setSwapError(null);
    resetWrite();
    setTokenOutAddress(addr);
  };

  const swapTokenPositions = () => {
    setSwapError(null);
    resetWrite();
    setTokenInAddress(tokenOutAddress);
    setTokenOutAddress(tokenInAddress);
    setSwapPath([toErc20Address(tokenOutAddress), toErc20Address(tokenInAddress)]);
  };

  const needsApproval = (amountIn: bigint) => (allowance ?? 0n) < amountIn;

  return {
    tokenIn,
    tokenOut,
    balanceInRaw: spendableForSwap,
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
    pendingApproval: pendingSwap?.kind === "approve" && isPending,
    needsApproval,
    swapError,
    clearSwapError
  };
}
