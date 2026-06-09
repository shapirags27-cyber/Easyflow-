"use client";

import * as React from "react";
import { formatUnits, type Address } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from "wagmi";
import { contracts } from "@/lib/contracts";
import { getTokenLabel } from "@/lib/tokens";
import { erc20Abi, stakingAbi } from "@/lib/abis";

function useStakingToken() {
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
  const tokenSymbol =
    stakingToken !== "0x0000000000000000000000000000000000000000"
      ? getTokenLabel(stakingToken, onChainSymbol as string | undefined)
      : "OPN";

  return { stakingToken, tokenSymbol, tokenDecimals };
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
  const { stakingToken, tokenSymbol, tokenDecimals } = useStakingToken();

  const { data: staked } = useReadContract({
    address: contracts.staking,
    abi: stakingAbi,
    functionName: "stakedBalance",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && contracts.staking) }
  });

  const stakedRaw = staked ?? 0n;
  const stakedAmount = formatUnits(stakedRaw, tokenDecimals);
  const stakedFormatted = `${stakedAmount} ${tokenSymbol}`;

  const { data: walletBalance } = useReadContract({
    address: stakingToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled:
        Boolean(address) && stakingToken !== "0x0000000000000000000000000000000000000000"
    }
  });
  const walletBalanceRaw = walletBalance ?? 0n;
  const walletBalanceFormatted = `${formatUnits(walletBalanceRaw, tokenDecimals)} ${tokenSymbol}`;

  const { data: totalStaked } = useReadContract({
    address: contracts.staking,
    abi: stakingAbi,
    functionName: "totalStaked",
    query: { enabled: Boolean(contracts.staking) }
  });
  const totalStakedFormatted = totalStaked
    ? `${formatUnits(totalStaked, tokenDecimals)} ${tokenSymbol}`
    : `0 ${tokenSymbol}`;

  const { data: allowance } = useReadContract({
    address: stakingToken,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, contracts.staking] : undefined,
    query: { enabled: Boolean(address && stakingToken && contracts.staking) }
  });

  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
  const isPending = isWritePending || isConfirming;

  const approveIfNeeded = React.useCallback(
    async (amount: bigint) => {
      const current = allowance ?? 0n;
      if (current >= amount) return;
      writeContract({
        address: stakingToken,
        abi: erc20Abi,
        functionName: "approve",
        args: [contracts.staking, amount]
      });
    },
    [allowance, stakingToken, writeContract]
  );

  const stake = React.useCallback(
    async (amount: bigint) => {
      await approveIfNeeded(amount);
      writeContract({
        address: contracts.staking,
        abi: stakingAbi,
        functionName: "stake",
        args: [amount]
      });
    },
    [approveIfNeeded, writeContract]
  );

  const unstake = React.useCallback(
    async (amount: bigint) => {
      writeContract({
        address: contracts.staking,
        abi: stakingAbi,
        functionName: "unstake",
        args: [amount]
      });
    },
    [writeContract]
  );

  return {
    tokenSymbol,
    tokenDecimals,
    stakedRaw,
    stakedAmount,
    stakedFormatted,
    walletBalanceRaw,
    walletBalanceFormatted,
    totalStakedFormatted,
    stake,
    unstake,
    isPending
  };
}
