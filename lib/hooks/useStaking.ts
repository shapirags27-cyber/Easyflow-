"use client";

import * as React from "react";
import { formatUnits, maxUint256, type Address } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from "wagmi";
import { contracts, STAKING_TOKEN_SYMBOL } from "@/lib/contracts";
import { getTokenLabel, isWopnAddress, LP_TOKEN_SYMBOL, WOPN_ADDRESS } from "@/lib/tokens";
import { iopnTestnet } from "@/lib/chains";
import { useLpPairs } from "@/lib/hooks/useLpPairs";
import { erc20Abi, stakingAbi, wopnAbi } from "@/lib/abis";

function formatStakeError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("user rejected") || lower.includes("user denied")) {
    return "Transaction cancelled.";
  }
  if (message.length > 120) return `${message.slice(0, 120)}…`;
  return message;
}

type PendingStake =
  | { kind: "wrap"; amount: bigint }
  | { kind: "approve"; amount: bigint };

function useStakingToken() {
  const { isLpPair } = useLpPairs();
  const { data: tokenAddr, isPending: isTokenAddrPending } = useReadContract({
    address: contracts.staking,
    abi: stakingAbi,
    functionName: "stakingToken",
    query: { enabled: Boolean(contracts.staking) }
  });

  const stakingToken = (tokenAddr ?? "0x0000000000000000000000000000000000000000") as Address;
  const isStakingTokenReady =
    stakingToken !== "0x0000000000000000000000000000000000000000" && !isTokenAddrPending;

  const { data: onChainSymbol } = useReadContract({
    address: stakingToken,
    abi: erc20Abi,
    functionName: "symbol",
    query: { enabled: isStakingTokenReady }
  });
  const { data: decimals } = useReadContract({
    address: stakingToken,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: isStakingTokenReady }
  });

  const tokenDecimals = decimals ? Number(decimals) : 18;
  const isWopnStaking = isStakingTokenReady && isWopnAddress(stakingToken);
  const isLpStakingToken = isStakingTokenReady && isLpPair(stakingToken);
  const tokenSymbol = isWopnStaking
    ? "OPN"
    : isLpStakingToken
      ? LP_TOKEN_SYMBOL
      : isStakingTokenReady
        ? getTokenLabel(stakingToken, onChainSymbol as string | undefined)
        : STAKING_TOKEN_SYMBOL;

  return {
    stakingToken,
    tokenSymbol,
    tokenDecimals,
    isLpStakingToken,
    isWopnStaking,
    isStakingTokenReady
  };
}

export function useStakedBalance() {
  const { address } = useAccount();
  const { tokenSymbol, tokenDecimals } = useStakingToken();

  const { data } = useReadContract({
    address: contracts.staking,
    abi: stakingAbi,
    functionName: "stakedBalance",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && contracts.staking) }
  });

  const stakedRaw = data ?? 0n;
  const stakedFormatted = `${formatUnits(stakedRaw, tokenDecimals)} ${tokenSymbol}`;
  return { stakedFormatted, stakedRaw, tokenSymbol, tokenDecimals };
}

export function useStaking() {
  const { address } = useAccount();
  const {
    stakingToken,
    tokenSymbol,
    tokenDecimals,
    isLpStakingToken,
    isWopnStaking,
    isStakingTokenReady
  } = useStakingToken();
  const [pendingStake, setPendingStake] = React.useState<PendingStake | null>(null);
  const [stakeError, setStakeError] = React.useState<string | null>(null);
  const [isFaucetPending, setIsFaucetPending] = React.useState(false);

  const { data: staked, refetch: refetchStaked, isPending: isStakedPending } = useReadContract({
    address: contracts.staking,
    abi: stakingAbi,
    functionName: "stakedBalance",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && contracts.staking), staleTime: 0 }
  });

  const stakedRaw = staked ?? 0n;
  const stakedAmount = formatUnits(stakedRaw, tokenDecimals);
  const stakedFormatted = `${stakedAmount} ${tokenSymbol}`;

  const {
    data: walletBalance,
    refetch: refetchBalance,
    isPending: isWalletBalancePending
  } = useReadContract({
    address: stakingToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && isStakingTokenReady),
      staleTime: 0
    }
  });

  const { data: wopnBalance, refetch: refetchWopnBalance } = useReadContract({
    address: WOPN_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && isWopnStaking), staleTime: 0 }
  });

  const { data: nativeOpnBal, refetch: refetchNativeOpn } = useBalance({
    address,
    chainId: iopnTestnet.id,
    query: { enabled: Boolean(address && isWopnStaking), staleTime: 0 }
  });

  const walletBalanceRaw = isWopnStaking
    ? (nativeOpnBal?.value ?? 0n) + (wopnBalance ?? 0n)
    : (walletBalance ?? 0n);
  const walletBalanceFormatted = `${formatUnits(walletBalanceRaw, tokenDecimals)} ${tokenSymbol}`;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: stakingToken,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, contracts.staking] : undefined,
    query: {
      enabled: Boolean(address && isStakingTokenReady && contracts.staking),
      staleTime: 0
    }
  });

  const prevAddressRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    const next = address?.toLowerCase();
    if (prevAddressRef.current === next) return;
    prevAddressRef.current = next;
    setPendingStake(null);
    setStakeError(null);
    if (!address) return;
    void refetchStaked();
    void refetchBalance();
    void refetchAllowance();
    if (isWopnStaking) {
      void refetchWopnBalance();
      void refetchNativeOpn();
    }
  }, [
    address,
    isWopnStaking,
    refetchAllowance,
    refetchBalance,
    refetchNativeOpn,
    refetchStaked,
    refetchWopnBalance
  ]);

  const { data: totalStaked } = useReadContract({
    address: contracts.staking,
    abi: stakingAbi,
    functionName: "totalStaked",
    query: { enabled: Boolean(contracts.staking) }
  });
  const totalStakedFormatted = totalStaked
    ? `${formatUnits(totalStaked, tokenDecimals)} ${tokenSymbol}`
    : `0 ${tokenSymbol}`;

  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWritePending,
    reset: resetWrite
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const isPending = isWritePending || isConfirming || isFaucetPending;

  React.useEffect(() => {
    if (!writeError) return;
    setStakeError(formatStakeError(writeError.message));
    setPendingStake(null);
    resetWrite();
  }, [writeError, resetWrite]);

  const needsApproval = React.useCallback(
    (amount: bigint) => (allowance ?? 0n) < amount,
    [allowance]
  );

  const runStakeTx = React.useCallback(
    (amount: bigint) => {
      writeContract({
        address: contracts.staking,
        abi: stakingAbi,
        functionName: "stake",
        args: [amount]
      });
    },
    [writeContract]
  );

  const continueAfterWrap = React.useCallback(
    (amount: bigint) => {
      if (needsApproval(amount)) {
        setPendingStake({ kind: "approve", amount });
        writeContract({
          address: stakingToken,
          abi: erc20Abi,
          functionName: "approve",
          args: [contracts.staking, maxUint256]
        });
        return;
      }
      runStakeTx(amount);
    },
    [needsApproval, runStakeTx, stakingToken, writeContract]
  );

  React.useEffect(() => {
    if (!isConfirmed || !pendingStake) return;

    if (pendingStake.kind === "wrap") {
      const { amount } = pendingStake;
      setPendingStake(null);
      void refetchWopnBalance();
      void refetchNativeOpn();
      void refetchAllowance();
      continueAfterWrap(amount);
      return;
    }

    if (pendingStake.kind === "approve") {
      const { amount } = pendingStake;
      setPendingStake(null);
      void refetchAllowance();
      runStakeTx(amount);
    }
  }, [continueAfterWrap, isConfirmed, pendingStake, refetchAllowance, refetchNativeOpn, refetchWopnBalance, runStakeTx]);

  React.useEffect(() => {
    if (isConfirmed && !pendingStake) {
      void refetchStaked();
      void refetchBalance();
      void refetchAllowance();
      if (isWopnStaking) {
        void refetchWopnBalance();
        void refetchNativeOpn();
      }
    }
  }, [
    isConfirmed,
    isWopnStaking,
    pendingStake,
    refetchAllowance,
    refetchBalance,
    refetchNativeOpn,
    refetchStaked,
    refetchWopnBalance
  ]);

  const stake = React.useCallback(
    (amount: bigint) => {
      if (!address || amount === 0n || !isStakingTokenReady) return;
      setStakeError(null);

      if (amount > walletBalanceRaw) return;

      if (isWopnStaking) {
        const wrapped = wopnBalance ?? 0n;
        const wrapAmount = amount > wrapped ? amount - wrapped : 0n;
        if (wrapAmount > 0n) {
          setPendingStake({ kind: "wrap", amount });
          writeContract({
            address: WOPN_ADDRESS,
            abi: wopnAbi,
            functionName: "deposit",
            value: wrapAmount
          });
          return;
        }
        if (needsApproval(amount)) {
          setPendingStake({ kind: "approve", amount });
          writeContract({
            address: stakingToken,
            abi: erc20Abi,
            functionName: "approve",
            args: [contracts.staking, maxUint256]
          });
          return;
        }
        runStakeTx(amount);
        return;
      }

      if (needsApproval(amount)) {
        setPendingStake({ kind: "approve", amount });
        writeContract({
          address: stakingToken,
          abi: erc20Abi,
          functionName: "approve",
          args: [contracts.staking, maxUint256]
        });
        return;
      }

      runStakeTx(amount);
    },
    [
      address,
      isStakingTokenReady,
      isWopnStaking,
      needsApproval,
      runStakeTx,
      stakingToken,
      walletBalanceRaw,
      wopnBalance,
      writeContract
    ]
  );

  const requestFaucet = React.useCallback(async () => {
    if (!address || isWopnStaking) return;
    setStakeError(null);
    setIsFaucetPending(true);
    try {
      const res = await fetch("/api/stake-faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address })
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setStakeError(data.error ?? "Could not mint staking tokens.");
        return;
      }
      await refetchBalance();
    } catch {
      setStakeError("Could not reach staking faucet.");
    } finally {
      setIsFaucetPending(false);
    }
  }, [address, isWopnStaking, refetchBalance]);

  const isWalletBalanceLoading =
    Boolean(address) &&
    isStakingTokenReady &&
    (isWalletBalancePending && walletBalance === undefined ||
      (isWopnStaking && nativeOpnBal === undefined && wopnBalance === undefined));
  const isStakedLoading = Boolean(address) && isStakedPending && staked === undefined;

  const unstake = React.useCallback(
    (amount: bigint) => {
      if (!address || amount === 0n) return;
      setStakeError(null);
      writeContract({
        address: contracts.staking,
        abi: stakingAbi,
        functionName: "unstake",
        args: [amount]
      });
    },
    [address, writeContract]
  );

  const pendingLabel = pendingStake?.kind === "wrap" ? "Wrapping…" : "Approving…";

  return {
    stakingToken,
    tokenSymbol,
    isLpStakingToken,
    isWopnStaking,
    isStakingTokenReady,
    tokenDecimals,
    stakedRaw,
    stakedAmount,
    stakedFormatted,
    walletBalanceRaw,
    walletBalanceFormatted,
    isWalletBalanceLoading,
    isStakedLoading,
    totalStakedFormatted,
    needsApproval,
    pendingApproval: pendingStake !== null && isPending,
    pendingLabel,
    stake,
    unstake,
    requestFaucet,
    isPending,
    error: stakeError,
    clearStakeError: () => {
      setStakeError(null);
      resetWrite();
    }
  };
}
