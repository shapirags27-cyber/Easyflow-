import { NextResponse } from "next/server";
import type { AdminPermission } from "@/lib/admin-roles";
import { hasPermission } from "@/lib/admin-roles";
import { validateCsrfToken, CSRF_HEADER } from "@/lib/server/admin/csrf";
import { getAdminSession, type AdminSessionPayload } from "@/lib/server/admin/session";

export class AdminAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireAdmin(
  req: Request,
  permission?: AdminPermission
): Promise<AdminSessionPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new AdminAuthError("Not authenticated.", 401);
  }

  if (permission && !hasPermission(session.role, permission)) {
    throw new AdminAuthError("Insufficient permissions.", 403);
  }

  const method = req.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    const csrfOk = await validateCsrfToken(req.headers.get(CSRF_HEADER));
    if (!csrfOk) {
      throw new AdminAuthError("Invalid CSRF token.", 403);
    }
  }

  return session;
}

export function adminErrorResponse(err: unknown) {
  if (err instanceof AdminAuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Request failed";
  return NextResponse.json({ error: message }, { status: 400 });
}
