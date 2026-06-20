import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeEmail, validateEmail, verifyPassword } from "@/lib/server/admin/password";
import { createLoginChallenge } from "@/lib/server/admin/session";
import { getClientMeta, logAdminActivity } from "@/lib/server/admin/audit";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  const meta = getClientMeta(req);
  const body = (await req.json()) as LoginBody;
  const emailErr = validateEmail(body.email ?? "");
  if (emailErr) {
    return NextResponse.json({ error: emailErr }, { status: 400 });
  }
  if (!body.password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const email = normalizeEmail(body.email!);
  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin) {
    await logAdminActivity({
      action: "login_failed",
      success: false,
      ...meta,
      metadata: { email, reason: "unknown_email" }
    });
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const valid = await verifyPassword(body.password, admin.passwordHash);
  if (!valid) {
    await logAdminActivity({
      action: "login_failed",
      adminId: admin.id,
      success: false,
      ...meta,
      metadata: { reason: "bad_password" }
    });
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await logAdminActivity({
    action: "login_attempt",
    adminId: admin.id,
    ...meta
  });

  if (!admin.twoFactorEnabled) {
    await createLoginChallenge(admin.id);
    return NextResponse.json({
      requires2FASetup: true,
      email: admin.email
    });
  }

  await createLoginChallenge(admin.id);
  return NextResponse.json({
    requires2FA: true,
    email: admin.email
  });
}
