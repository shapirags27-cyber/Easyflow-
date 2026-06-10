import type { Address, PublicClient } from "viem";
import { contracts } from "@/lib/contracts";
import { ammFactoryAbi } from "@/lib/abis";

const CACHE_MS = 5 * 60 * 1000;
let cachedPairs: Address[] | null = null;
let cachedAt = 0;
let pairSet = new Set<string>();

export async function loadAmmPairAddresses(client: PublicClient): Promise<Address[]> {
  if (cachedPairs && Date.now() - cachedAt < CACHE_MS) {
    return cachedPairs;
  }

  if (!contracts.ammFactory) {
    cachedPairs = [];
    pairSet = new Set();
    cachedAt = Date.now();
    return cachedPairs;
  }

  const pairCount = await client.readContract({
    address: contracts.ammFactory,
    abi: ammFactoryAbi,
    functionName: "allPairsLength"
  });

  const pairs: Address[] = [];
  const batchSize = 20;
  for (let start = 0; start < Number(pairCount); start += batchSize) {
    const end = Math.min(start + batchSize, Number(pairCount));
    const chunk = await Promise.all(
      Array.from({ length: end - start }, (_, i) =>
        client.readContract({
          address: contracts.ammFactory,
          abi: ammFactoryAbi,
          functionName: "allPairs",
          args: [BigInt(start + i)]
        })
      )
    );
    pairs.push(...chunk);
  }

  cachedPairs = pairs;
  pairSet = new Set(pairs.map((p) => p.toLowerCase()));
  cachedAt = Date.now();
  return pairs;
}

export function isLpPairAddress(address: string): boolean {
  return pairSet.has(address.toLowerCase());
}
