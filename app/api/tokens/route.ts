import { NextResponse } from "next/server";
import { getPublicClient } from "@/lib/server/chain";
import { loadAmmTokens } from "@/lib/amm-tokens";

export async function GET() {
  try {
    const tokens = await loadAmmTokens(getPublicClient());
    return NextResponse.json({ tokens });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load tokens";
    return NextResponse.json({ error: message, tokens: [] }, { status: 500 });
  }
}
