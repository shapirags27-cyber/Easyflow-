import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { prisma } from "@/lib/db";
import {
  getAdminAdjustmentTotal,
  readLeaderboard,
  readOnChainPoints
} from "@/lib/server/admin/points-service";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin/require-admin";
import { getClientMeta, logAdminActivity } from "@/lib/server/admin/audit";

export async function GET(req: Request) {
  try {
    await requireAdmin(req, "points:read");
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet")?.toLowerCase();
    const list = searchParams.get("list");

    if (list === "leaderboard") {
      const leaderboard = await readLeaderboard(25);
      return NextResponse.json({ leaderboard });
    }

    const adjustments = await prisma.adminPointAdjustment.findMany({
      where: wallet ? { wallet } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { admin: { select: { email: true } } }
    });

    if (wallet) {
      if (!isAddress(wallet)) {
        return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
      }
      const onChainPoints = await readOnChainPoints(wallet as Address);
      const adminAdjustmentTotal = await getAdminAdjustmentTotal(wallet);
      const effectiveTotal = Number(onChainPoints) + adminAdjustmentTotal;

      return NextResponse.json({
        wallet,
        onChainPoints: onChainPoints.toString(),
        adminAdjustmentTotal,
        effectiveTotal,
        adjustments
      });
    }

    return NextResponse.json({ adjustments });
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

    const onChainPoints = await readOnChainPoints(wallet as Address);
    const adminAdjustmentTotal = await getAdminAdjustmentTotal(wallet);

    return NextResponse.json({
      ok: true,
      adjustment,
      onChainPoints: onChainPoints.toString(),
      adminAdjustmentTotal,
      effectiveTotal: Number(onChainPoints) + adminAdjustmentTotal
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireAdmin(req, "points:write");
    const meta = getClientMeta(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const wallet = searchParams.get("wallet")?.toLowerCase();

    if (id) {
      const row = await prisma.adminPointAdjustment.findUnique({ where: { id } });
      if (!row) {
        return NextResponse.json({ error: "Adjustment not found." }, { status: 404 });
      }
      await prisma.adminPointAdjustment.delete({ where: { id } });
      await logAdminActivity({
        action: "points_adjust",
        adminId: session.adminId,
        ...meta,
        metadata: { action: "delete_one", id, wallet: row.wallet, delta: row.delta }
      });
      return NextResponse.json({ ok: true, deleted: 1 });
    }

    if (wallet && isAddress(wallet)) {
      const result = await prisma.adminPointAdjustment.deleteMany({ where: { wallet } });
      await logAdminActivity({
        action: "points_adjust",
        adminId: session.adminId,
        ...meta,
        metadata: { action: "clear_wallet", wallet, count: result.count }
      });
      return NextResponse.json({ ok: true, deleted: result.count });
    }

    return NextResponse.json({ error: "Provide id or wallet to delete." }, { status: 400 });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
