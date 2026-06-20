import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/server/admin/password";
import { verifyTotpCode } from "@/lib/server/admin/totp";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin/require-admin";
import { getClientMeta, logAdminActivity } from "@/lib/server/admin/audit";

type DisableBody = {
  password?: string;
  code?: string;
};

export async function POST(req: Request) {
  try {
    const session = await requireAdmin(req, "settings:write");
    const meta = getClientMeta(req);
    const body = (await req.json()) as DisableBody;

    if (!body.password || !body.code) {
      return NextResponse.json({ error: "Password and 2FA code are required." }, { status: 400 });
    }

    const admin = await prisma.admin.findUniqueOrThrow({ where: { id: session.adminId } });
    const validPwd = await verifyPassword(body.password, admin.passwordHash);
    if (!validPwd) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    if (!admin.twoFactorSecret || !(await verifyTotpCode(admin.twoFactorSecret, body.code))) {
      return NextResponse.json({ error: "Invalid 2FA code." }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.admin.update({
        where: { id: admin.id },
        data: { twoFactorEnabled: false, twoFactorSecret: null }
      }),
      prisma.adminRecoveryCode.deleteMany({ where: { adminId: admin.id } })
    ]);

    await logAdminActivity({
      action: "2fa_disabled",
      adminId: admin.id,
      ...meta
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
