import { NextResponse } from "next/server";
import { getRecentTransactions, logTransaction } from "@/lib/server/transactions";
import { dbHealthCheck } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  if (!(await dbHealthCheck())) {
    return NextResponse.json({ transactions: [], source: "offline" });
  }

  const transactions = await getRecentTransactions(wallet);
  return NextResponse.json({ transactions, source: "database" });
}

export async function POST(req: Request) {
  if (!(await dbHealthCheck())) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const body = await req.json();
  const { wallet, type, amount, positive, txHash } = body;

  if (!wallet || !type || !amount) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const row = await logTransaction({
    wallet,
    type,
    amount,
    positive: Boolean(positive),
    txHash
  });

  return NextResponse.json({ id: row.id });
}
