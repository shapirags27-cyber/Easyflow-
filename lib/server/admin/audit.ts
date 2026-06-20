import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type AuditAction =
  | "login_attempt"
  | "login_success"
  | "login_failed"
  | "logout"
  | "password_change"
  | "password_reset_request"
  | "password_reset_complete"
  | "2fa_setup"
  | "2fa_enabled"
  | "2fa_disabled"
  | "2fa_verify_failed"
  | "recovery_code_used"
  | "fees_update"
  | "points_adjust"
  | "admin_action";

type AuditParams = {
  action: AuditAction;
  adminId?: string;
  success?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logAdminActivity(params: AuditParams): Promise<void> {
  try {
    await prisma.adminActivityLog.create({
      data: {
        action: params.action,
        adminId: params.adminId,
        success: params.success ?? true,
        ipAddress: params.ipAddress ?? undefined,
        userAgent: params.userAgent ?? undefined,
        metadata: params.metadata
          ? (params.metadata as Prisma.InputJsonValue)
          : undefined
      }
    });
  } catch {
    // Audit logging must not break primary flows
  }
}

export function getClientMeta(req: Request) {
  return {
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null,
    userAgent: req.headers.get("user-agent")
  };
}
