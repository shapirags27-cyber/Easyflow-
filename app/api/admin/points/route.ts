import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { prisma } from "@/lib/db";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin/require-admin";
import { getClientMeta, logAdminActivity } from "@/lib/server/admin/audit";

export async function GET(req: Request) {
  try {
    await requireAdmin(req, "points:read");
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet")?.toLowerCase();

    if (wallet && !isAddress(wallet)) {
      return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
    }

    const adjustments = await prisma.adminPointAdjustment.findMany({
      where: wallet ? { wallet } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { admin: { select: { email: true } } }
    });

    const totals = wallet
      ? await prisma.adminPointAdjustment.aggregate({
          where: { wallet },
          _sum: { delta: true }
        })
      : null;

    return NextResponse.json({
      adjustments,
      totalForWallet: totals?._sum.delta ?? 0
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

type AdjustBody = {
  wallet?: string;
  delta?: number;
  reason?: string;
};

export async function POST(req: Request) {
  try {
    const session = await requireAdmin(req, "points:write");
    const meta = getClientMeta(req);
    const body = (await req.json()) as AdjustBody;

    const wallet = body.wallet?.toLowerCase();
    if (!wallet || !isAddress(wallet)) {
      return NextResponse.json({ error: "Valid wallet address is required." }, { status: 400 });
    }
    if (typeof body.delta !== "number" || !Number.isInteger(body.delta) || body.delta === 0) {
      return NextResponse.json({ error: "Delta must be a non-zero integer." }, { status: 400 });
    }

    const adjustment = await prisma.adminPointAdjustment.create({
      data: {
        wallet,
        delta: body.delta,
        reason: body.reason?.trim() || null,
        adminId: session.adminId
      }
    });

    await logAdminActivity({
      action: "points_adjust",
      adminId: session.adminId,
      ...meta,
      metadata: { wallet, delta: body.delta, reason: body.reason }
    });

    const total = await prisma.adminPointAdjustment.aggregate({
      where: { wallet },
      _sum: { delta: true }
    });

    return NextResponse.json({
      ok: true,
      adjustment,
      totalForWallet: total._sum.delta ?? 0
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
