import { NextResponse } from "next/server";
import { dbHealthCheck } from "@/lib/db";

export async function GET() {
  const db = await dbHealthCheck();
  return NextResponse.json({
    status: "ok",
    database: db ? "connected" : "unavailable",
    timestamp: new Date().toISOString()
  });
}
