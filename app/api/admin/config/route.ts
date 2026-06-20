import { NextResponse } from "next/server";
import { contracts } from "@/lib/contracts";
import { readProtocolFees } from "@/lib/server/fees";
import { getAdminSession } from "@/lib/server/admin/session";

export async function GET() {
  let fees = null;
  try {
    fees = await readProtocolFees();
  } catch {
    fees = null;
  }

  const session = await getAdminSession();

  return NextResponse.json({
    auth: session ? { email: session.email, role: session.role } : null,
    contracts,
    fees,
    backend: {
      feeControl: "/api/admin/fees",
      publicFees: "/api/fees",
      adminLogin: "/admin/login"
    }
  });
}
