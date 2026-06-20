import type { Address } from "viem";
import { contracts } from "@/lib/contracts";
import { pointsManagerAbi } from "@/lib/abis";
import { getPublicClient } from "@/lib/server/chain";
import { prisma } from "@/lib/db";

export async function readOnChainPoints(wallet: Address): Promise<bigint> {
  if (!contracts.pointsManager) return 0n;
  const client = getPublicClient();
  return client.readContract({
    address: contracts.pointsManager,
    abi: pointsManagerAbi,
    functionName: "points",
    args: [wallet]
  });
}

export async function readLeaderboard(limit = 20) {
  if (!contracts.pointsManager) return [];
  const client = getPublicClient();
  const [users, scores] = await client.readContract({
    address: contracts.pointsManager,
    abi: pointsManagerAbi,
    functionName: "getLeaderboard",
    args: [BigInt(limit)]
  });
  return users
    .map((user, i) => ({
      wallet: user.toLowerCase(),
      onChainPoints: scores[i]?.toString() ?? "0"
    }))
    .filter((row) => row.wallet !== "0x0000000000000000000000000000000000000000");
}

export async function getAdminAdjustmentTotal(wallet: string): Promise<number> {
  const result = await prisma.adminPointAdjustment.aggregate({
    where: { wallet: wallet.toLowerCase() },
    _sum: { delta: true }
  });
  return result._sum.delta ?? 0;
}
