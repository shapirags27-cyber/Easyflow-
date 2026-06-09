import type { Address, PublicClient } from "viem";
import { contracts } from "@/lib/contracts";
import { ammRouterAbi } from "@/lib/abis";
import { buildCandidatePaths } from "@/lib/swap-path";

export type SwapQuoteResult =
  | { ok: true; path: Address[]; amountOut: bigint }
  | { ok: false; reason: string };

export async function fetchSwapQuote(
  client: PublicClient,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint
): Promise<SwapQuoteResult> {
  if (amountIn === 0n) {
    return { ok: false, reason: "Enter amount to see quote" };
  }

  if (!contracts.ammRouter) {
    return { ok: false, reason: "AMM router not configured." };
  }

  const paths = await buildCandidatePaths(client, tokenIn, tokenOut);
  if (paths.length === 0) {
    return { ok: false, reason: "Select two different tokens." };
  }

  let lastReason = "No liquidity for this pair.";

  for (const path of paths) {
    try {
      const amounts = await client.readContract({
        address: contracts.ammRouter,
        abi: ammRouterAbi,
        functionName: "getAmountsOut",
        args: [amountIn, path]
      });
      const amountOut = amounts[amounts.length - 1] ?? 0n;
      if (amountOut > 0n) {
        return { ok: true, path, amountOut };
      }
      lastReason = "Pool exists but returned zero output.";
    } catch {
      lastReason =
        path.length === 2
          ? "No direct pool — trying multi-hop routes."
          : "No swap route found — add liquidity on Pools.";
    }
  }

  return {
    ok: false,
    reason:
      paths.length > 1
        ? "No swap route with liquidity for this token pair."
        : lastReason
  };
}
