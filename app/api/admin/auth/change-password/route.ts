import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  validatePassword,
  verifyPassword
} from "@/lib/server/admin/password";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin/require-admin";
import { getClientMeta, logAdminActivity } from "@/lib/server/admin/audit";

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
};

export async function POST(req: Request) {
  try {
    const session = await requireAdmin(req, "settings:write");
    const meta = getClientMeta(req);
    const body = (await req.json()) as ChangePasswordBody;

    const pwdErr = validatePassword(body.newPassword ?? "");
    if (pwdErr) {
      return NextResponse.json({ error: pwdErr }, { status: 400 });
    }
    if (!body.currentPassword) {
      return NextResponse.json({ error: "Current password is required." }, { status: 400 });
    }

    const admin = await prisma.admin.findUniqueOrThrow({ where: { id: session.adminId } });
    const valid = await verifyPassword(body.currentPassword, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    const passwordHash = await hashPassword(body.newPassword!);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash }
    });

    await logAdminActivity({
      action: "password_change",
      adminId: admin.id,
      ...meta
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
