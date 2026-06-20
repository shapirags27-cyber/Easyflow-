import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession, destroyAdminSession } from "@/lib/server/admin/session";
import { getClientMeta, logAdminActivity } from "@/lib/server/admin/audit";

export async function POST(req: Request) {
  const meta = getClientMeta(req);
  const session = await getAdminSession();
  if (session) {
    await logAdminActivity({
      action: "logout",
      adminId: session.adminId,
      ...meta
    });
  }
  await destroyAdminSession();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { email: true, role: true, twoFactorEnabled: true }
  });

  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    admin: {
      email: admin.email,
      role: admin.role,
      twoFactorEnabled: admin.twoFactorEnabled
    }
  });
}
