import type { Address, PublicClient } from "viem";
import { contracts } from "@/lib/contracts";
import { ammFactoryAbi, ammPairAbi } from "@/lib/abis";

export type AmmGraph = Map<string, Set<string>>;

const CACHE_MS = 5 * 60 * 1000;
let cachedGraph: AmmGraph | null = null;
let cachedAt = 0;

export async function loadAmmGraph(client: PublicClient): Promise<AmmGraph> {
  if (cachedGraph && Date.now() - cachedAt < CACHE_MS) {
    return cachedGraph;
  }

  const graph: AmmGraph = new Map();
  const addEdge = (a: Address, b: Address) => {
    const ak = a.toLowerCase();
    const bk = b.toLowerCase();
    if (!graph.has(ak)) graph.set(ak, new Set());
    if (!graph.has(bk)) graph.set(bk, new Set());
    graph.get(ak)!.add(bk);
    graph.get(bk)!.add(ak);
  };

  if (!contracts.ammFactory) {
    cachedGraph = graph;
    cachedAt = Date.now();
    return graph;
  }

  const pairCount = await client.readContract({
    address: contracts.ammFactory,
    abi: ammFactoryAbi,
    functionName: "allPairsLength"
  });

  const batchSize = 20;
  for (let start = 0; start < Number(pairCount); start += batchSize) {
    const end = Math.min(start + batchSize, Number(pairCount));
    const pairAddresses = await Promise.all(
      Array.from({ length: end - start }, (_, i) =>
        client.readContract({
          address: contracts.ammFactory,
          abi: ammFactoryAbi,
          functionName: "allPairs",
          args: [BigInt(start + i)]
        })
      )
    );

    const tokenPairs = await Promise.all(
      pairAddresses.map(async (pair) => {
        const [t0, t1] = await Promise.all([
          client.readContract({ address: pair, abi: ammPairAbi, functionName: "token0" }),
          client.readContract({ address: pair, abi: ammPairAbi, functionName: "token1" })
        ]);
        return [t0, t1] as const;
      })
    );

    for (const [t0, t1] of tokenPairs) {
      addEdge(t0, t1);
    }
  }

  cachedGraph = graph;
  cachedAt = Date.now();
  return graph;
}

/** BFS shortest swap path through the AMM liquidity graph (max 4 hops). */
export function findSwapPaths(
  graph: AmmGraph,
  tokenIn: Address,
  tokenOut: Address,
  maxHops = 4
): Address[][] {
  const start = tokenIn.toLowerCase();
  const goal = tokenOut.toLowerCase();
  if (start === goal) return [];

  const paths: Address[][] = [];
  const queue: { node: string; path: string[] }[] = [{ node: start, path: [start] }];
  const visitedDepth = new Map<string, number>();
  visitedDepth.set(start, 0);

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    const depth = path.length - 1;
    if (depth >= maxHops) continue;

    const neighbors = graph.get(node);
    if (!neighbors) continue;

    for (const next of neighbors) {
      if (next === goal) {
        paths.push(path.concat(next).map((a) => a as Address));
        continue;
      }

      const nextDepth = depth + 1;
      const prev = visitedDepth.get(next);
      if (prev !== undefined && prev <= nextDepth) continue;

      visitedDepth.set(next, nextDepth);
      queue.push({ node: next, path: path.concat(next) });
    }
  }

  paths.sort((a, b) => a.length - b.length);
  return paths;
}
