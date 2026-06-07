"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contracts } from "@/lib/contracts";
import { multiSendAbi } from "@/lib/abis";

export function useMultiSend() {
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
  const isPending = isWritePending || isConfirming;

  const sendFixed = (recipients: `0x${string}`[], amounts: bigint[], value: bigint) => {
    writeContract({
      address: contracts.multiSend,
      abi: multiSendAbi,
      functionName: "multiSendFixed",
      args: [recipients, amounts],
      value
    });
  };

  const sendPercent = (recipients: `0x${string}`[], bps: bigint[], value: bigint) => {
    writeContract({
      address: contracts.multiSend,
      abi: multiSendAbi,
      functionName: "multiSendPercent",
      args: [recipients, bps],
      value
    });
  };

  return { sendFixed, sendPercent, isPending };
}

