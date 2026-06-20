import { cookies } from "next/headers";
import { randomToken, hashToken } from "@/lib/server/admin/crypto";

export const CSRF_COOKIE = "easyflow_admin_csrf";
export const CSRF_HEADER = "x-csrf-token";

export async function createCsrfToken(): Promise<string> {
  const token = randomToken(24);
  const jar = await cookies();
  jar.set(CSRF_COOKIE, hashToken(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return token;
}

export async function validateCsrfToken(headerToken: string | null): Promise<boolean> {
  if (!headerToken) return false;
  const jar = await cookies();
  const cookieHash = jar.get(CSRF_COOKIE)?.value;
  if (!cookieHash) return false;
  return hashToken(headerToken) === cookieHash;
}
