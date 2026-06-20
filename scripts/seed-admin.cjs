require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@easyflow.io";
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!password) {
    console.error("Set ADMIN_SEED_PASSWORD before running seed.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ADMIN_SEED_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email: email.toLowerCase() },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      role: "SUPER_ADMIN"
    },
    update: {
      passwordHash,
      role: "SUPER_ADMIN"
    }
  });

  console.log("Super admin ready:", admin.email);
  console.log("Visit /admin and click Sign in — 2FA setup required on first login.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
