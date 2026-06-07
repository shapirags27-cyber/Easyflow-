import type { Address } from "viem";

export type Token = {
  symbol: string;
  name: string;
  address: Address;
};

export const TOKENS: Token[] = [
  {
    symbol: "WOPN",
    name: "Wrapped OPN",
    address: "0xBc022C9dEb5AF250A526321d16Ef52E39b4DBD84"
  },
  {
    symbol: "OPNV2",
    name: "OPN V2",
    address: "0xA463ce9F738E0B4035D8d036B902D0efADb24d20"
  },
  {
    symbol: "tUSDT",
    name: "tUSDT",
    address: "0x3e01b4d892E0D0A219eF8BBe7e260a6bc8d9B31b"
  },
  {
    symbol: "OPN",
    name: "OPN",
    address: "0xBc022C9dEb5AF250A526321d16Ef52E39b4DBD84"
  }
];

export function getToken(symbol: string): Token | undefined {
  return TOKENS.find((t) => t.symbol === symbol);
}

export function getTokenAddress(symbol: string): Address {
  return getToken(symbol)?.address ?? "0x0000000000000000000000000000000000000000";
}

/** One entry per contract address (OPN and WOPN share the same address). */
export function getUniqueTokens(): Token[] {
  const seen = new Set<string>();
  return TOKENS.filter((t) => {
    const key = t.address.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
