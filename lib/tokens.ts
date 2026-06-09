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
  },
  {
    symbol: "OPN",
    name: "Legacy Pool Token A",
    address: "0x2E9e88e3816324d2697fD8B523e0062B55d779d0"
  },
  {
    symbol: "OPN-B",
    name: "Legacy Pool Token B",
    address: "0x1A07f1061a63C7b3D6d320b70f93003946720182"
  }
];

/** Legacy mock tokens from initial IOPN deploy — show friendly labels in UI. */
const LEGACY_TOKEN_LABELS: Record<string, string> = {
  "0x2e9e88e3816324d2697fd8b523e0062b55d779d0": "OPN",
  "0x1a07f1061a63c7b3d6d320b70f93003946720182": "OPN"
};

export function getTokenByAddress(address: string): Token | undefined {
  return TOKENS.find((t) => t.address.toLowerCase() === address.toLowerCase());
}

export function getTokenLabel(address: string, onChainSymbol?: string): string {
  const known = getTokenByAddress(address);
  if (known) return known.symbol;
  const legacy = LEGACY_TOKEN_LABELS[address.toLowerCase()];
  if (legacy) return legacy;
  const sym = onChainSymbol?.trim();
  if (sym && /^[AB]$/i.test(sym)) return "OPN";
  if (sym && sym.length > 1) return sym;
  return "OPN";
}

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
