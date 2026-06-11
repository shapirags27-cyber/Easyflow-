"use client";

import * as React from "react";
import { formatUnits, maxUint256, type Address } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from "wagmi";
import { contracts, STAKING_TOKEN_SYMBOL } from "@/lib/contracts";
import { getTokenLabel, LP_TOKEN_SYMBOL } from "@/lib/tokens";
import { useLpPairs } from "@/lib/hooks/useLpPairs";
import { erc20Abi, stakingAbi } from "@/lib/abis";

function isAddressLikeLabel(label: string) {
  const s = label.trim();
  return s.startsWith("0x") || s.includes("…");
}

function useStakingToken() {
  const { isLpPair } = useLpPairs();
  const { data: tokenAddr } = useReadContract({
    address: contracts.staking,
    abi: stakingAbi,
    functionName: "stakingToken",
    query: { enabled: Boolean(contracts.staking) }
  });

  const stakingToken = (tokenAddr ?? "0x0000000000000000000000000000000000000000") as Address;

  const { data: onChainSymbol } = useReadContract({
    address: stakingToken,
    abi: erc20Abi,
    functionName: "symbol",
    query: { enabled: stakingToken !== "0x0000000000000000000000000000000000000000" }
  });
  const { data: decimals } = useReadContract({
    address: stakingToken,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: stakingToken !== "0x0000000000000000000000000000000000000000" }
  });

  const tokenDecimals = decimals ? Number(decimals) : 18;
  const onChainLabel = getTokenLabel(stakingToken, onChainSymbol as string | undefined);
  const isLpStakingToken =
    stakingToken !== "0x0000000000000000000000000000000000000000" &&
    (isLpPair(stakingToken) || isAddressLikeLabel(onChainLabel));
  const tokenSymbol = isLpStakingToken
    ? LP_TOKEN_SYMBOL
    : stakingToken !== "0x0000000000000000000000000000000000000000"
      ? STAKING_TOKEN_SYMBOL || onChainLabel
      : STAKING_TOKEN_SYMBOL;

  return { stakingToken, tokenSymbol, onChainLabel, tokenDecimals, isLpStakingToken };
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
  const { stakingToken, tokenSymbol, onChainLabel, tokenDecimals, isLpStakingToken } =
    useStakingToken();
  const [pendingStakeAmount, setPendingStakeAmount] = React.useState<bigint | null>(null);

  const { data: staked, refetch: refetchStaked, isLoading: isStakedLoading } = useReadContract({
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
    isLoading: isWalletBalanceLoading
  } = useReadContract({
    address: stakingToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled:
        Boolean(address) && stakingToken !== "0x0000000000000000000000000000000000000000",
      staleTime: 0
    }
  });
  const walletBalanceRaw = walletBalance ?? 0n;
  const walletBalanceFormatted = `${formatUnits(walletBalanceRaw, tokenDecimals)} ${tokenSymbol}`;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: stakingToken,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, contracts.staking] : undefined,
    query: {
      enabled: Boolean(address && stakingToken && contracts.staking),
      staleTime: 0
    }
  });

  React.useEffect(() => {
    setPendingStakeAmount(null);
    if (!address) return;
    void refetchStaked();
    void refetchBalance();
    void refetchAllowance();
  }, [address, refetchAllowance, refetchBalance, refetchStaked]);

  const { data: totalStaked } = useReadContract({
    address: contracts.staking,
    abi: stakingAbi,
    functionName: "totalStaked",
    query: { enabled: Boolean(contracts.staking) }
  });
  const totalStakedFormatted = totalStaked
    ? `${formatUnits(totalStaked, tokenDecimals)} ${tokenSymbol}`
    : `0 ${tokenSymbol}`;

  const { writeContract, data: hash, error: writeError, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const isPending = isWritePending || isConfirming;

  React.useEffect(() => {
    if (!isConfirmed || pendingStakeAmount === null) return;

    const amount = pendingStakeAmount;
    setPendingStakeAmount(null);
    void refetchAllowance();

    writeContract({
      address: contracts.staking,
      abi: stakingAbi,
      functionName: "stake",
      args: [amount]
    });
  }, [isConfirmed, pendingStakeAmount, refetchAllowance, writeContract]);

  React.useEffect(() => {
    if (isConfirmed) {
      void refetchStaked();
      void refetchBalance();
    }
  }, [isConfirmed, refetchStaked, refetchBalance]);

  const needsApproval = React.useCallback(
    (amount: bigint) => (allowance ?? 0n) < amount,
    [allowance]
  );

  const stake = React.useCallback(
    (amount: bigint) => {
      if (!address || amount === 0n) return;

      if (needsApproval(amount)) {
        setPendingStakeAmount(amount);
        writeContract({
          address: stakingToken,
          abi: erc20Abi,
          functionName: "approve",
          args: [contracts.staking, maxUint256]
        });
        return;
      }

      writeContract({
        address: contracts.staking,
        abi: stakingAbi,
        functionName: "stake",
        args: [amount]
      });
    },
    [address, needsApproval, stakingToken, writeContract]
  );

  const unstake = React.useCallback(
    (amount: bigint) => {
      if (!address || amount === 0n) return;
      writeContract({
        address: contracts.staking,
        abi: stakingAbi,
        functionName: "unstake",
        args: [amount]
      });
    },
    [address, writeContract]
  );

  return {
    stakingToken,
    tokenSymbol,
    onChainLabel,
    isLpStakingToken,
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
    pendingApproval: pendingStakeAmount !== null,
    stake,
    unstake,
    isPending,
    error: writeError?.message ?? null
  };
}
