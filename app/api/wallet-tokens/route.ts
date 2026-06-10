import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { erc20Abi } from "@/lib/abis";
import { loadAmmTokens } from "@/lib/amm-tokens";
import { getPublicClient } from "@/lib/server/chain";
import {
  getSwapTokens,
  mergeTokenLists,
  resolveTokenSymbol,
  WOPN_ADDRESS,
  type Token
} from "@/lib/tokens";

const BATCH_SIZE = 14;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");

  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  try {
    const client = getPublicClient();
    const poolTokens = await loadAmmTokens(client);
    const candidates = mergeTokenLists(getSwapTokens(), poolTokens);

    const uniqueAddrs = Array.from(
      new Map(candidates.map((t) => [t.address.toLowerCase(), t.address])).values()
    ) as Address[];

    const held: Token[] = [];
    const nativeBal = await client.getBalance({ address: wallet as Address });
    if (nativeBal > 0n) {
      held.push({ symbol: "OPN", name: "OPN", address: WOPN_ADDRESS });
    }

    for (let i = 0; i < uniqueAddrs.length; i += BATCH_SIZE) {
      const chunk = uniqueAddrs.slice(i, i + BATCH_SIZE);
      const balances = await Promise.all(
        chunk.map((token) =>
          client
            .readContract({
              address: token,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [wallet as Address]
            })
            .catch(() => 0n)
        )
      );

      const needsSymbol = chunk.filter((_, idx) => balances[idx] > 0n);
      const symbols = await Promise.all(
        needsSymbol.map((token) => {
          const known = candidates.find((t) => t.address.toLowerCase() === token.toLowerCase());
          if (known && !known.symbol.includes("…")) {
            return Promise.resolve(known.symbol);
          }
          return client
            .readContract({ address: token, abi: erc20Abi, functionName: "symbol" })
            .then((s) => String(s))
            .catch(() => "");
        })
      );

      needsSymbol.forEach((token, idx) => {
        const sym = resolveTokenSymbol(token, symbols[idx]);
        held.push({ symbol: sym, name: sym, address: token });
      });
    }

    const byAddr = new Map<string, Token>();
    for (const t of held) {
      const key = t.address.toLowerCase();
      const prev = byAddr.get(key);
      if (!prev || t.symbol === "OPN") {
        byAddr.set(key, t);
      }
    }

    const tokens = Array.from(byAddr.values()).sort((a, b) =>
      a.symbol.localeCompare(b.symbol)
    );

    return NextResponse.json({
      tokens,
      hasNativeOpn: nativeBal > 0n,
      nativeBalance: nativeBal.toString()
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load wallet tokens";
    return NextResponse.json({ error: message, tokens: [] }, { status: 500 });
  }
}
