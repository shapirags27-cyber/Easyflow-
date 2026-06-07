"use client";

import * as React from "react";
import { useAccount, useReadContract } from "wagmi";
import { contracts } from "@/lib/contracts";
import { pointsManagerAbi } from "@/lib/abis";

export function usePoints() {
  const { address } = useAccount();
  const { data } = useReadContract({
    address: contracts.pointsManager,
    abi: pointsManagerAbi,
    functionName: "points",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && contracts.pointsManager) }
  });

  return { points: data ? data.toString() : "0" };
}

export type LeaderboardRow = { user: string; points: string };

export function useLeaderboard(limit = 20n) {
  const [rows, setRows] = React.useState<LeaderboardRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!contracts.pointsManager) return;
    setIsLoading(true);
    try {
      // wagmi doesn't give us imperative read without a client here,
      // so we rely on a hidden hook-based read by toggling state.
      // For simplicity, we do a direct fetch using viem public client from wagmi config.
      const { createPublicClient, http } = await import("viem");
      const { iopnTestnet } = await import("@/lib/chains");
      const client = createPublicClient({
        chain: iopnTestnet,
        transport: http(iopnTestnet.rpcUrls.default.http[0])
      });
      const res = await client.readContract({
        address: contracts.pointsManager,
        abi: pointsManagerAbi,
        functionName: "getLeaderboard",
        args: [limit]
      });
      const [users, scores] = res as readonly [`0x${string}`[], bigint[]];
      const next = users.map((u, i) => ({ user: u, points: scores[i]?.toString() ?? "0" }));
      setRows(next.filter((x) => x.user !== "0x0000000000000000000000000000000000000000"));
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  return { leaderboard: rows, refresh, isLoading };
}

