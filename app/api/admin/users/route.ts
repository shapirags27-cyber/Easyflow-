import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { prisma } from "@/lib/db";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin/require-admin";
import { getClientMeta, logAdminActivity } from "@/lib/server/admin/audit";

export async function GET(req: Request) {
  try {
    await requireAdmin(req, "users:read");
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet")?.toLowerCase();

    if (wallet) {
      if (!isAddress(wallet)) {
        return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
      }
      const transactions = await prisma.transactionLog.findMany({
        where: { wallet },
        orderBy: { createdAt: "desc" },
        take: 50
      });
      return NextResponse.json({ wallet, transactions });
    }

    const recent = await prisma.transactionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    });

    const wallets = [...new Set(recent.map((r) => r.wallet))].slice(0, 30);

    return NextResponse.json({ wallets, recentActivity: recent.slice(0, 25) });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireAdmin(req, "users:write");
    const meta = getClientMeta(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const wallet = searchParams.get("wallet")?.toLowerCase();

    if (id) {
      await prisma.transactionLog.delete({ where: { id } });
      await logAdminActivity({
        action: "admin_action",
        adminId: session.adminId,
        ...meta,
        metadata: { action: "delete_activity", id }
      });
      return NextResponse.json({ ok: true, deleted: 1 });
    }

    if (wallet && isAddress(wallet)) {
      const result = await prisma.transactionLog.deleteMany({ where: { wallet } });
      await logAdminActivity({
        action: "admin_action",
        adminId: session.adminId,
        ...meta,
        metadata: { action: "clear_wallet_activity", wallet, count: result.count }
      });
      return NextResponse.json({ ok: true, deleted: result.count });
    }

    return NextResponse.json({ error: "Provide id or wallet to delete." }, { status: 400 });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
