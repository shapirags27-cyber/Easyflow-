import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateTotpSecret, generateTotpQrDataUrl } from "@/lib/server/admin/totp";
import { verifyLoginChallenge } from "@/lib/server/admin/session";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin/require-admin";
import { getClientMeta, logAdminActivity } from "@/lib/server/admin/audit";

/** Start 2FA setup — returns QR code + secret (requires login challenge or active session). */
export async function POST(req: Request) {
  try {
    const meta = getClientMeta(req);
    let adminId: string | null = null;

    const session = await (async () => {
      try {
        return await requireAdmin(req, "settings:write");
      } catch {
        return null;
      }
    })();

    if (session) {
      adminId = session.adminId;
    } else {
      const challenge = await verifyLoginChallenge();
      if (challenge) adminId = challenge.adminId;
    }

    if (!adminId) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const admin = await prisma.admin.findUniqueOrThrow({ where: { id: adminId } });
    const secret = generateTotpSecret();
    const qrDataUrl = await generateTotpQrDataUrl(admin.email, secret);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { twoFactorSecret: secret, twoFactorEnabled: false }
    });

    await logAdminActivity({
      action: "2fa_setup",
      adminId: admin.id,
      ...meta
    });

    return NextResponse.json({ qrDataUrl, secret });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
