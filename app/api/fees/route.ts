import { NextResponse } from "next/server";
import { readProtocolFees } from "@/lib/server/fees";

/** Public read of current on-chain protocol fees. */
export async function GET() {
  try {
    const fees = await readProtocolFees();
    return NextResponse.json(fees);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to read fees";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
