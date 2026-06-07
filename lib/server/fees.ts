import { encodeFunctionData, type Address, type Hex } from "viem";
import { contracts } from "@/lib/contracts";
import { protocolFeesAbi } from "@/lib/abis";
import { getPublicClient } from "@/lib/server/chain";

export type ProtocolFeeSnapshot = {
  swapFeeBps: number;
  multisendFeeBps: number;
  stakingFeeBps: number;
  feeRecipient: Address;
  feeBase: number;
};

export async function readProtocolFees(): Promise<ProtocolFeeSnapshot> {
  const client = getPublicClient();
  const addr = contracts.protocolFees;
  if (!addr || addr === "0x0000000000000000000000000000000000000000") {
    return {
      swapFeeBps: 30,
      multisendFeeBps: 0,
      stakingFeeBps: 0,
      feeRecipient: "0x0000000000000000000000000000000000000000",
      feeBase: 10_000
    };
  }

  const [swapFeeBps, multisendFeeBps, stakingFeeBps, feeRecipient, feeBase] =
    await Promise.all([
      client.readContract({ address: addr, abi: protocolFeesAbi, functionName: "swapFeeBps" }),
      client.readContract({ address: addr, abi: protocolFeesAbi, functionName: "multisendFeeBps" }),
      client.readContract({ address: addr, abi: protocolFeesAbi, functionName: "stakingFeeBps" }),
      client.readContract({ address: addr, abi: protocolFeesAbi, functionName: "feeRecipient" }),
      client.readContract({ address: addr, abi: protocolFeesAbi, functionName: "FEE_BASE" })
    ]);

  return {
    swapFeeBps: Number(swapFeeBps),
    multisendFeeBps: Number(multisendFeeBps),
    stakingFeeBps: Number(stakingFeeBps),
    feeRecipient: feeRecipient as Address,
    feeBase: Number(feeBase)
  };
}

export function encodeSetFeesTx(fees: {
  swapFeeBps: number;
  multisendFeeBps: number;
  stakingFeeBps: number;
}): { to: Address; data: Hex } {
  const data = encodeFunctionData({
    abi: protocolFeesAbi,
    functionName: "setFees",
    args: [BigInt(fees.swapFeeBps), BigInt(fees.multisendFeeBps), BigInt(fees.stakingFeeBps)]
  });
  return { to: contracts.protocolFees, data };
}
