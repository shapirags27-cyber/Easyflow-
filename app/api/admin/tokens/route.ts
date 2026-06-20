import { NextResponse } from "next/server";
import { getPublicClient } from "@/lib/server/chain";
import { loadAmmTokens } from "@/lib/amm-tokens";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin/require-admin";

export async function GET(req: Request) {
  try {
    await requireAdmin(req, "tokens:read");
    const client = getPublicClient();
    const tokens = await loadAmmTokens(client);
    return NextResponse.json({
      count: tokens.length,
      tokens
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
