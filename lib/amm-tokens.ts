import type { Address, PublicClient } from "viem";
import { TOKENS, type Token } from "@/lib/tokens";
import { loadAmmGraph } from "@/lib/amm-graph";

const CACHE_MS = 5 * 60 * 1000;
let cachedTokens: Token[] | null = null;
let cachedAt = 0;

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export async function loadAmmTokens(client: PublicClient): Promise<Token[]> {
  if (cachedTokens && Date.now() - cachedAt < CACHE_MS) {
    return cachedTokens;
  }

  const graph = await loadAmmGraph(client);
  const addresses = Array.from(graph.keys()) as Address[];

  const byAddr = new Map<string, Token>();
  for (const t of TOKENS) {
    byAddr.set(t.address.toLowerCase(), t);
  }
  for (const addr of addresses) {
    const key = addr.toLowerCase();
    if (!byAddr.has(key)) {
      byAddr.set(key, {
        symbol: shortAddr(addr),
        name: "AMM pool token",
        address: addr
      });
    }
  }

  const merged = Array.from(byAddr.values()).sort((a, b) =>
    a.symbol.localeCompare(b.symbol)
  );

  cachedTokens = merged;
  cachedAt = Date.now();
  return merged;
}

