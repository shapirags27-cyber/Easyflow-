import type { Admin } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword, normalizeEmail } from "@/lib/server/admin/password";

export function isAdminAuthConfigured(): boolean {
  const email = process.env.ADMIN_SEED_EMAIL?.trim();
  const password = process.env.ADMIN_SEED_PASSWORD;
  return Boolean(email && password && password.length >= 8);
}

/** Create the first admin from Railway env vars when the table is empty. */
export async function bootstrapAdminIfEmpty(
  email: string,
  password: string
): Promise<Admin | null> {
  const seedEmail = normalizeEmail(process.env.ADMIN_SEED_EMAIL ?? "admin@easyflow.io");
  const seedPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!seedPassword || normalizeEmail(email) !== seedEmail || password !== seedPassword) {
    return null;
  }

  const count = await prisma.admin.count();
  if (count > 0) return null;

  const passwordHash = await hashPassword(password);
  return prisma.admin.create({
    data: {
      email: seedEmail,
      passwordHash,
      role: "SUPER_ADMIN"
    }
  });
}

/** Idempotent upsert used on deploy/start. */
export async function seedAdminFromEnv(): Promise<void> {
  const seedPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!seedPassword) return;

  const seedEmail = normalizeEmail(process.env.ADMIN_SEED_EMAIL ?? "admin@easyflow.io");
  const passwordHash = await hashPassword(seedPassword);

  await prisma.admin.upsert({
    where: { email: seedEmail },
    create: {
      email: seedEmail,
      passwordHash,
      role: "SUPER_ADMIN"
    },
    update: {
      passwordHash,
      role: "SUPER_ADMIN"
    }
  });
}
