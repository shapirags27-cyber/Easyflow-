-- CreateTable
CREATE TABLE "TransactionLog" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "positive" BOOLEAN NOT NULL DEFAULT true,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "admin" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformStat" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "tvl" TEXT NOT NULL DEFAULT '0',
    "totalStaked" TEXT NOT NULL DEFAULT '0',
    "totalSwapped" TEXT NOT NULL DEFAULT '0',
    "pointsDistributed" TEXT NOT NULL DEFAULT '0',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionLog_wallet_createdAt_idx" ON "TransactionLog"("wallet", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt" DESC);

-- Seed default platform stats row
INSERT INTO "PlatformStat" ("id", "tvl", "totalStaked", "totalSwapped", "pointsDistributed", "updatedAt")
VALUES ('global', '$2.45M', '1.28M OPN', '6.73M OPN', '1.94M', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
