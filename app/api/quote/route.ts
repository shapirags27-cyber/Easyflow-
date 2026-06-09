import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { getPublicClient } from "@/lib/server/chain";
import { fetchSwapQuote } from "@/lib/swap-quote";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tokenIn = searchParams.get("tokenIn");
  const tokenOut = searchParams.get("tokenOut");
  const amountWei = searchParams.get("amountWei");

  if (!tokenIn || !tokenOut || !isAddress(tokenIn) || !isAddress(tokenOut)) {
    return NextResponse.json({ error: "Invalid token addresses" }, { status: 400 });
  }

  let amountIn = 0n;
  if (amountWei) {
    try {
      amountIn = BigInt(amountWei);
    } catch {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
  }

  const result = await fetchSwapQuote(
    getPublicClient(),
    tokenIn as Address,
    tokenOut as Address,
    amountIn
  );

  if (!result.ok) {
    return NextResponse.json({
      amountOut: "0",
      path: [],
      error: result.reason
    });
  }

  return NextResponse.json({
    amountOut: result.amountOut.toString(),
    path: result.path,
    error: null
  });
}
