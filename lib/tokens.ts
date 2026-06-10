import type { Address } from "viem";

export type Token = {
  symbol: string;
  name: string;
  address: Address;
};

/** Sentinel for native chain OPN (like ETH). */
export const NATIVE_OPN_ADDRESS =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address;

export const WOPN_ADDRESS = "0xBc022C9dEb5AF250A526321d16Ef52E39b4DBD84" as Address;
export const OPNT_ADDRESS = "0xA463ce9F738E0B4035D8d036B902D0efADb24d20" as Address;
export const TUSDT_ADDRESS = "0x3e01b4d892E0D0A219eF8BBe7e260a6bc8d9B31b" as Address;

export const TOKENS: Token[] = [
  { symbol: "OPN", name: "OPN", address: NATIVE_OPN_ADDRESS },
  { symbol: "WOPN", name: "Wrapped OPN", address: WOPN_ADDRESS },
  { symbol: "OPNT", name: "OPNT", address: OPNT_ADDRESS },
  { symbol: "tUSDT", name: "tUSDT", address: TUSDT_ADDRESS }
];

const LEGACY_TOKEN_LABELS: Record<string, string> = {
  "0x2e9e88e3816324d2697fd8b523e0062b55d779d0": "OPN",
  "0x1a07f1061a63c7b3d6d320b70f93003946720182": "OPN"
};

export function isNativeOpn(address: string) {
  return address.toLowerCase() === NATIVE_OPN_ADDRESS.toLowerCase();
}

export function isWopnAddress(address: string) {
  return address.toLowerCase() === WOPN_ADDRESS.toLowerCase();
}

/** Map native OPN to WOPN ERC-20 for AMM/router calls. */
export function toErc20Address(address: Address): Address {
  return isNativeOpn(address) ? WOPN_ADDRESS : address;
}

export function tokenKey(token: Token) {
  return `${token.address.toLowerCase()}:${token.symbol}`;
}

export function getTokenByAddress(address: string): Token | undefined {
  if (isNativeOpn(address)) {
    return { symbol: "OPN", name: "OPN", address: NATIVE_OPN_ADDRESS };
  }
  const key = address.toLowerCase();
  return TOKENS.find((t) => t.address.toLowerCase() === key);
}

function isBadTicker(sym: string) {
  const s = sym.trim();
  return !s || s.startsWith("0x") || s.includes("…") || /^[AB]$/i.test(s);
}

export function resolveTokenSymbol(address: string, onChainSymbol?: string): string {
  if (isNativeOpn(address)) return "OPN";
  if (isWopnAddress(address)) return "WOPN";
  const known = getTokenByAddress(address);
  if (known?.symbol && !isBadTicker(known.symbol)) {
    return known.symbol;
  }
  const label = getTokenLabel(address, onChainSymbol);
  return isBadTicker(label) ? onChainSymbol?.trim() || "TOKEN" : label;
}

export function getTokenLabel(address: string, onChainSymbol?: string): string {
  if (isNativeOpn(address)) return "OPN";
  if (isWopnAddress(address)) return "WOPN";
  const known = getTokenByAddress(address);
  if (known) return known.symbol;
  const legacy = LEGACY_TOKEN_LABELS[address.toLowerCase()];
  if (legacy) return legacy;
  const sym = onChainSymbol?.trim();
  if (sym && /^[AB]$/i.test(sym)) return "OPN";
  if (sym && sym.length > 1) return sym;
  return sym || "TOKEN";
}

export function getToken(symbol: string): Token | undefined {
  return TOKENS.find((t) => t.symbol === symbol);
}

export function getTokenAddress(symbol: string): Address {
  if (symbol === "OPN") return WOPN_ADDRESS;
  if (symbol === "WOPN") return WOPN_ADDRESS;
  return getToken(symbol)?.address ?? "0x0000000000000000000000000000000000000000";
}

export function getUniqueTokens(): Token[] {
  return TOKENS;
}

export function getSwapTokens(): Token[] {
  return [
    { symbol: "OPN", name: "OPN", address: NATIVE_OPN_ADDRESS },
    { symbol: "WOPN", name: "Wrapped OPN", address: WOPN_ADDRESS },
    { symbol: "OPNT", name: "OPNT", address: OPNT_ADDRESS },
    { symbol: "tUSDT", name: "tUSDT", address: TUSDT_ADDRESS }
  ];
}

export function mergeTokenLists(...lists: Token[][]): Token[] {
  const byKey = new Map<string, Token>();
  for (const list of lists) {
    for (const t of list) {
      byKey.set(tokenKey(t), t);
    }
  }
  return Array.from(byKey.values());
}
