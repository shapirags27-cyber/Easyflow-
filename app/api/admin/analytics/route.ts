import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPlatformStats } from "@/lib/server/transactions";
import { readLeaderboard } from "@/lib/server/admin/points-service";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin/require-admin";
import { dbHealthCheck } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await requireAdmin(req, "analytics:read");

    const dbOk = await dbHealthCheck();
    const stats = dbOk ? await getPlatformStats() : null;

    const [adjustmentCount, activityCount, transactionCount, recentLogs] = dbOk
      ? await Promise.all([
          prisma.adminPointAdjustment.count(),
          prisma.adminActivityLog.count(),
          prisma.transactionLog.count(),
          prisma.adminActivityLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { admin: { select: { email: true } } }
          })
        ])
      : [0, 0, 0, []];

    let leaderboard: Awaited<ReturnType<typeof readLeaderboard>> = [];
    try {
      leaderboard = await readLeaderboard(10);
    } catch {
      leaderboard = [];
    }

    return NextResponse.json({
      dbConnected: dbOk,
      platform: stats,
      counts: {
        pointAdjustments: adjustmentCount,
        adminActivityLogs: activityCount,
        userTransactions: transactionCount
      },
      leaderboard,
      recentAdminActivity: recentLogs
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
