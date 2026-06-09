import { isAddress, type Address } from "viem";
import { TOKENS, getUniqueTokens, type Token } from "@/lib/tokens";

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function searchSwapTokens(query: string, catalog: Token[] = getUniqueTokens()): Token[] {
  const q = query.trim().toLowerCase();

  if (!q) return catalog;

  const matched = [...catalog, ...TOKENS].filter(
    (t) =>
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q)
  );

  const byAddress = new Map<string, Token>();
  for (const t of matched) {
    byAddress.set(t.address.toLowerCase(), t);
  }

  if (isAddress(query.trim())) {
    const addr = query.trim() as Address;
    const key = addr.toLowerCase();
    if (!byAddress.has(key)) {
      const known = TOKENS.find((t) => t.address.toLowerCase() === key);
      byAddress.set(
        key,
        known ?? { symbol: shortAddr(addr), name: "Custom token", address: addr }
      );
    }
  }

  return Array.from(byAddress.values());
}
