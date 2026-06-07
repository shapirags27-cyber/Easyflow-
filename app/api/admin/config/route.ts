import { NextResponse } from "next/server";
import { ADMIN_ADDRESS } from "@/lib/admin";
import { contracts } from "@/lib/contracts";
import { readProtocolFees } from "@/lib/server/fees";

export async function GET() {
  let fees = null;
  try {
    fees = await readProtocolFees();
  } catch {
    fees = null;
  }

  return NextResponse.json({
    adminAddress: ADMIN_ADDRESS,
    contracts,
    fees,
    backend: {
      feeControl: "/api/admin/fees",
      publicFees: "/api/fees"
    }
  });
}
