import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, normalizeEmail, validateEmail, validatePassword } from "@/lib/server/admin/password";
import { hashToken, randomToken } from "@/lib/server/admin/crypto";
import { getClientMeta, logAdminActivity } from "@/lib/server/admin/audit";

type ResetRequestBody = { email?: string };

export async function POST(req: Request) {
  const meta = getClientMeta(req);
  const body = (await req.json()) as ResetRequestBody;
  const emailErr = validateEmail(body.email ?? "");
  if (emailErr) {
    return NextResponse.json({ error: emailErr }, { status: 400 });
  }

  const email = normalizeEmail(body.email!);
  const admin = await prisma.admin.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (admin) {
    const rawToken = randomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.adminPasswordReset.create({
      data: { adminId: admin.id, tokenHash, expiresAt }
    });

    await logAdminActivity({
      action: "password_reset_request",
      adminId: admin.id,
      ...meta
    });

    // In production, send email with reset link. For testnet, return token in dev only.
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        ok: true,
        message: "If the email exists, a reset link was sent.",
        devResetToken: rawToken
      });
    }
  }

  return NextResponse.json({
    ok: true,
    message: "If the email exists, a reset link was sent."
  });
}

type ResetConfirmBody = {
  token?: string;
  password?: string;
};

export async function PUT(req: Request) {
  const meta = getClientMeta(req);
  const body = (await req.json()) as ResetConfirmBody;
  const pwdErr = validatePassword(body.password ?? "");
  if (pwdErr) {
    return NextResponse.json({ error: pwdErr }, { status: 400 });
  }
  if (!body.token) {
    return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
  }

  const tokenHash = hashToken(body.token);
  const reset = await prisma.adminPasswordReset.findUnique({
    where: { tokenHash },
    include: { admin: true }
  });

  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 });
  }

  const passwordHash = await hashPassword(body.password!);
  await prisma.$transaction([
    prisma.admin.update({
      where: { id: reset.adminId },
      data: { passwordHash }
    }),
    prisma.adminPasswordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() }
    }),
    prisma.adminSession.deleteMany({ where: { adminId: reset.adminId } })
  ]);

  await logAdminActivity({
    action: "password_reset_complete",
    adminId: reset.adminId,
    ...meta
  });

  return NextResponse.json({ ok: true });
}
