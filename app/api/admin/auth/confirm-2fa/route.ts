import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/server/admin/password";
import { generateRecoveryCodes, hashToken } from "@/lib/server/admin/crypto";
import { verifyTotpCode } from "@/lib/server/admin/totp";
import {
  clearLoginChallenge,
  createAdminSession,
  verifyLoginChallenge
} from "@/lib/server/admin/session";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin/require-admin";
import { getClientMeta, logAdminActivity } from "@/lib/server/admin/audit";
import { createCsrfToken } from "@/lib/server/admin/csrf";

type ConfirmBody = { code?: string };

export async function POST(req: Request) {
  try {
    const meta = getClientMeta(req);
    const body = (await req.json()) as ConfirmBody;
    if (!body.code) {
      return NextResponse.json({ error: "2FA code is required." }, { status: 400 });
    }

    let adminId: string | null = null;
    let fromChallenge = false;

    try {
      const session = await requireAdmin(req, "settings:write");
      adminId = session.adminId;
    } catch {
      const challenge = await verifyLoginChallenge();
      if (challenge) {
        adminId = challenge.adminId;
        fromChallenge = true;
      }
    }

    if (!adminId) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const admin = await prisma.admin.findUniqueOrThrow({ where: { id: adminId } });
    if (!admin.twoFactorSecret) {
      return NextResponse.json({ error: "Start 2FA setup first." }, { status: 400 });
    }

    if (!(await verifyTotpCode(admin.twoFactorSecret, body.code))) {
      return NextResponse.json({ error: "Invalid 2FA code." }, { status: 401 });
    }

    const plainCodes = generateRecoveryCodes(10);
    const codeHashes = await Promise.all(plainCodes.map((c) => hashPassword(c)));

    await prisma.$transaction(async (tx) => {
      await tx.adminRecoveryCode.deleteMany({ where: { adminId: admin.id } });
      await tx.adminRecoveryCode.createMany({
        data: codeHashes.map((codeHash) => ({ adminId: admin.id, codeHash }))
      });
      await tx.admin.update({
        where: { id: admin.id },
        data: { twoFactorEnabled: true }
      });
    });

    await logAdminActivity({
      action: "2fa_enabled",
      adminId: admin.id,
      ...meta
    });

    let csrfToken: string | undefined;
    if (fromChallenge) {
      await clearLoginChallenge();
      await createAdminSession(
        { id: admin.id, email: admin.email, role: admin.role },
        meta
      );
      csrfToken = await createCsrfToken();
      await logAdminActivity({
        action: "login_success",
        adminId: admin.id,
        ...meta,
        metadata: { via: "2fa_setup" }
      });
    }

    return NextResponse.json({
      ok: true,
      recoveryCodes: plainCodes,
      csrfToken
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
