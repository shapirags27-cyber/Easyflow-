import type { Address, PublicClient } from "viem";
import { findSwapPaths, loadAmmGraph } from "@/lib/amm-graph";

/** Hub tokens tried when graph is unavailable. */
const FALLBACK_HUBS = [
  "0xBc022C9dEb5AF250A526321d16Ef52E39b4DBD84", // WOPN
  "0x3e01b4d892E0D0A219eF8BBe7e260a6bc8d9B31b", // tUSDT
  "0xA463ce9F738E0B4035D8d036B902D0efADb24d20" // OPNT
] as Address[];

function fallbackPaths(tokenIn: Address, tokenOut: Address): Address[][] {
  if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) return [];

  const paths: Address[][] = [[tokenIn, tokenOut]];
  const inL = tokenIn.toLowerCase();
  const outL = tokenOut.toLowerCase();

  for (const hub of FALLBACK_HUBS) {
    const h = hub.toLowerCase();
    if (h === inL || h === outL) continue;
    paths.push([tokenIn, hub, tokenOut]);
  }

  for (let i = 0; i < FALLBACK_HUBS.length; i++) {
    for (let j = i + 1; j < FALLBACK_HUBS.length; j++) {
      const h0 = FALLBACK_HUBS[i].toLowerCase();
      const h1 = FALLBACK_HUBS[j].toLowerCase();
      if (h0 === inL || h1 === inL || h0 === outL || h1 === outL) continue;
      paths.push([tokenIn, FALLBACK_HUBS[i], FALLBACK_HUBS[j], tokenOut]);
    }
  }

  return paths;
}

export async function buildCandidatePaths(
  client: PublicClient,
  tokenIn: Address,
  tokenOut: Address
): Promise<Address[][]> {
  if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) return [];

  try {
    const graph = await loadAmmGraph(client);
    const graphPaths = findSwapPaths(graph, tokenIn, tokenOut);
    if (graphPaths.length > 0) return graphPaths;
  } catch {
    // fall through to hub-based paths
  }

  return fallbackPaths(tokenIn, tokenOut);
}
