import { prisma } from "@/lib/db";

export type TxRow = {
  type: string;
  amount: string;
  positive: boolean;
  time: string;
};

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function getRecentTransactions(wallet: string, limit = 10): Promise<TxRow[]> {
  const rows = await prisma.transactionLog.findMany({
    where: { wallet: wallet.toLowerCase() },
    orderBy: { createdAt: "desc" },
    take: limit
  });

  return rows.map((r) => ({
    type: r.type,
    amount: r.amount,
    positive: r.positive,
    time: formatRelativeTime(r.createdAt)
  }));
}

export async function logTransaction(input: {
  wallet: string;
  type: string;
  amount: string;
  positive: boolean;
  txHash?: string;
}) {
  return prisma.transactionLog.create({
    data: {
      wallet: input.wallet.toLowerCase(),
      type: input.type,
      amount: input.amount,
      positive: input.positive,
      txHash: input.txHash
    }
  });
}

export async function getPlatformStats() {
  const stats = await prisma.platformStat.findUnique({ where: { id: "global" } });
  return (
    stats ?? {
      tvl: "$2.45M",
      totalStaked: "1.28M OPN",
      totalSwapped: "6.73M OPN",
      pointsDistributed: "1.94M"
    }
  );
}
