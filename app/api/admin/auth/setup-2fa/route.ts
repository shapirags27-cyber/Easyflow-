import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateTotpSecret, generateTotpQrDataUrl } from "@/lib/server/admin/totp";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin/require-admin";
import { getClientMeta, logAdminActivity } from "@/lib/server/admin/audit";

/** Start 2FA setup from Account & Security (authenticated admin only). */
export async function POST(req: Request) {
  try {
    const session = await requireAdmin(req, "settings:write");
    const meta = getClientMeta(req);

    const admin = await prisma.admin.findUniqueOrThrow({ where: { id: session.adminId } });
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

    return NextResponse.json({ qrDataUrl });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
