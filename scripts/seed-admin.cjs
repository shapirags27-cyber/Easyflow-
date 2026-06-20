require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const email = (process.env.ADMIN_SEED_EMAIL ?? "admin@easyflow.io").toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!password) {
    console.log("Admin seed skipped: ADMIN_SEED_PASSWORD is not set.");
    return;
  }

  if (password.length < 8) {
    console.error("ADMIN_SEED_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.log("Admin seed skipped: DATABASE_URL is not set.");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.upsert({
      where: { email },
      create: {
        email,
        passwordHash,
        role: "SUPER_ADMIN"
      },
      update: {
        passwordHash,
        role: "SUPER_ADMIN"
      }
    });

    console.log("Super admin ready:", admin.email);
    console.log("Visit /admin and sign in — enable 2FA optionally under Account & Security.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Admin seed failed:", err.message ?? err);
  process.exit(1);
});
