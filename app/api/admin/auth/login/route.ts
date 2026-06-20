import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  bootstrapAdminIfEmpty,
  isAdminAuthConfigured
} from "@/lib/server/admin/bootstrap";
import { normalizeEmail, validateEmail, verifyPassword } from "@/lib/server/admin/password";
import { createLoginChallenge } from "@/lib/server/admin/session";
import { getClientMeta, logAdminActivity } from "@/lib/server/admin/audit";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  const meta = getClientMeta(req);

  try {
    const body = (await req.json()) as LoginBody;
    const emailErr = validateEmail(body.email ?? "");
    if (emailErr) {
      return NextResponse.json({ error: emailErr }, { status: 400 });
    }
    if (!body.password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    if (!isAdminAuthConfigured()) {
      return NextResponse.json(
        {
          error:
            "Admin login is not configured. Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD on the server."
        },
        { status: 503 }
      );
    }

    const email = normalizeEmail(body.email!);
    let admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      admin = await bootstrapAdminIfEmpty(email, body.password);
    }

    if (!admin) {
      await logAdminActivity({
        action: "login_failed",
        success: false,
        ...meta,
        metadata: { email, reason: "unknown_email" }
      });
      return NextResponse.json(
        {
          error:
            "Invalid email or password. If this is a new deploy, ensure ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are set and redeploy."
        },
        { status: 401 }
      );
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    if (message.includes("Admin") || message.includes("does not exist")) {
      return NextResponse.json(
        {
          error:
            "Admin database is not ready. Run migrations on Railway (build:railway) or check DATABASE_URL."
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
