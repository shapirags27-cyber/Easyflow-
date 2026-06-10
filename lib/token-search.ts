import { isAddress, type Address } from "viem";
import { TOKENS, getSwapTokens, tokenKey, type Token } from "@/lib/tokens";

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function searchSwapTokens(query: string, catalog: Token[] = getSwapTokens()): Token[] {
  const q = query.trim().toLowerCase();

  if (!q) return catalog;

  const matched = catalog.filter(
    (t) =>
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q)
  );

  const byKey = new Map<string, Token>();
  for (const t of matched) {
    byKey.set(tokenKey(t), t);
  }

  if (isAddress(query.trim())) {
    const addr = query.trim() as Address;
    const known = TOKENS.find((t) => t.address.toLowerCase() === addr.toLowerCase());
    const custom = known ?? { symbol: shortAddr(addr), name: "Custom token", address: addr };
    byKey.set(tokenKey(custom), custom);
  }

  return Array.from(byKey.values());
}
