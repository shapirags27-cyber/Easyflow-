import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/server/admin/crypto";
import { verifyTotpCode } from "@/lib/server/admin/totp";
import { verifyPassword } from "@/lib/server/admin/password";
import {
  clearLoginChallenge,
  createAdminSession,
  verifyLoginChallenge
} from "@/lib/server/admin/session";
import { getClientMeta, logAdminActivity } from "@/lib/server/admin/audit";
import { createCsrfToken } from "@/lib/server/admin/csrf";

type VerifyBody = {
  code?: string;
  recoveryCode?: string;
};

export async function POST(req: Request) {
  const meta = getClientMeta(req);
  const challenge = await verifyLoginChallenge();
  if (!challenge) {
    return NextResponse.json({ error: "Login session expired. Sign in again." }, { status: 401 });
  }

  const body = (await req.json()) as VerifyBody;
  const admin = await prisma.admin.findUnique({
    where: { id: challenge.adminId },
    include: { recoveryCodes: { where: { usedAt: null } } }
  });

  if (!admin || !admin.twoFactorEnabled || !admin.twoFactorSecret) {
    return NextResponse.json({ error: "Complete 2FA setup first." }, { status: 400 });
  }

  let verified = false;

  if (body.code) {
    verified = await verifyTotpCode(admin.twoFactorSecret, body.code);
  } else if (body.recoveryCode) {
    const normalized = body.recoveryCode.trim().toUpperCase();
    for (const rc of admin.recoveryCodes) {
      const match = await verifyPassword(normalized, rc.codeHash);
      if (match) {
        await prisma.adminRecoveryCode.update({
          where: { id: rc.id },
          data: { usedAt: new Date() }
        });
        verified = true;
        await logAdminActivity({
          action: "recovery_code_used",
          adminId: admin.id,
          ...meta
        });
        break;
      }
    }
  }

  if (!verified) {
    await logAdminActivity({
      action: "2fa_verify_failed",
      adminId: admin.id,
      success: false,
      ...meta
    });
    return NextResponse.json({ error: "Invalid 2FA or recovery code." }, { status: 401 });
  }

  await clearLoginChallenge();
  await createAdminSession(
    { id: admin.id, email: admin.email, role: admin.role },
    meta
  );
  const csrfToken = await createCsrfToken();

  await logAdminActivity({
    action: "login_success",
    adminId: admin.id,
    ...meta
  });

  return NextResponse.json({
    ok: true,
    admin: { email: admin.email, role: admin.role },
    csrfToken
  });
}
