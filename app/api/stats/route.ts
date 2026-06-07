import { NextResponse } from "next/server";
import { getPlatformStats } from "@/lib/server/transactions";
import { dbHealthCheck } from "@/lib/db";

export async function GET() {
  if (!(await dbHealthCheck())) {
    return NextResponse.json({
      tvl: "$2.45M",
      totalStaked: "1.28M OPN",
      totalSwapped: "6.73M OPN",
      pointsDistributed: "1.94M",
      source: "fallback"
    });
  }

  const stats = await getPlatformStats();
  return NextResponse.json({ ...stats, source: "database" });
}
