import { NextResponse } from "next/server";
import { getPublicClient } from "@/lib/server/chain";
import { loadAmmPairAddresses } from "@/lib/amm-pairs";

export async function GET() {
  try {
    const pairs = await loadAmmPairAddresses(getPublicClient());
    return NextResponse.json({ pairs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load AMM pairs";
    return NextResponse.json({ error: message, pairs: [] }, { status: 500 });
  }
}
