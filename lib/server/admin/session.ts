import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashToken, randomToken } from "@/lib/server/admin/crypto";

export const SESSION_COOKIE = "easyflow_admin_session";
export const CHALLENGE_COOKIE = "easyflow_admin_challenge";

const SESSION_HOURS = 8;
const CHALLENGE_MINUTES = 10;

export type AdminSessionPayload = {
  adminId: string;
  sessionId: string;
  email: string;
  role: AdminRole;
};

function getSessionSecret(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be set (min 32 chars).");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(
  admin: { id: string; email: string; role: AdminRole },
  meta?: { ipAddress?: string | null; userAgent?: string | null }
): Promise<string> {
  const rawToken = randomToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);

  const session = await prisma.adminSession.create({
    data: {
      adminId: admin.id,
      tokenHash,
      expiresAt,
      ipAddress: meta?.ipAddress ?? undefined,
      userAgent: meta?.userAgent ?? undefined
    }
  });

  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLogin: new Date() }
  });

  const jwt = await new SignJWT({
    adminId: admin.id,
    sessionId: session.id,
    email: admin.email,
    role: admin.role
  } satisfies AdminSessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSessionSecret());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60
  });

  return rawToken;
}

export async function createLoginChallenge(adminId: string): Promise<string> {
  const challenge = randomToken(24);
  const jwt = await new SignJWT({ adminId, type: "2fa_challenge" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CHALLENGE_MINUTES}m`)
    .sign(getSessionSecret());

  const jar = await cookies();
  jar.set(CHALLENGE_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CHALLENGE_MINUTES * 60
  });

  return challenge;
}

export async function verifyLoginChallenge(): Promise<{ adminId: string } | null> {
  const jar = await cookies();
  const token = jar.get(CHALLENGE_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (payload.type !== "2fa_challenge" || typeof payload.adminId !== "string") {
      return null;
    }
    return { adminId: payload.adminId };
  } catch {
    return null;
  }
}

export async function clearLoginChallenge(): Promise<void> {
  const jar = await cookies();
  jar.delete(CHALLENGE_COOKIE);
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const adminId = payload.adminId as string;
    const sessionId = payload.sessionId as string;
    const email = payload.email as string;
    const role = payload.role as AdminRole;

    if (!adminId || !sessionId || !email || !role) return null;

    const session = await prisma.adminSession.findUnique({
      where: { id: sessionId }
    });

    if (!session || session.adminId !== adminId || session.expiresAt < new Date()) {
      return null;
    }

    return { adminId, sessionId, email, role };
  } catch {
    return null;
  }
}

export async function destroyAdminSession(): Promise<void> {
  const session = await getAdminSession();
  if (session) {
    await prisma.adminSession.delete({ where: { id: session.sessionId } }).catch(() => null);
  }
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(CHALLENGE_COOKIE);
}
