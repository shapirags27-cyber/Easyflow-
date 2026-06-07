"use client";

import { useAccount, useBalance } from "wagmi";
import { Coins, Award, Wallet, TrendingUp } from "lucide-react";
import { AppShellBar } from "@/components/layout/app-shell-bar";
import { StatCard } from "@/components/ui/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";
import { RecentTxs } from "@/components/dashboard/recent-txs";
import { PointsProgress } from "@/components/dashboard/points-progress";
import { usePoints } from "@/lib/hooks/usePoints";
import { useStaking } from "@/lib/hooks/useStaking";
import { formatBalanceAmount } from "@/lib/format-balance";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: bal } = useBalance({ address });
  const { points } = usePoints();
  const { stakedFormatted, totalStakedFormatted } = useStaking();
  const pts = isConnected ? Number(points) || 0 : 0;

  return (
    <>
      <AppShellBar title="Dashboard" subtitle="Welcome back 👋" />
      <div className="space-y-6 p-4 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="OPN Balance"
            value={formatBalanceAmount(bal) ?? "—"}
            sub={bal ? `$${(Number(formatBalanceAmount(bal)) * 0.8421).toFixed(2)}` : "Connect wallet"}
            icon={Wallet}
          />
          <StatCard
            title="Total Points"
            value={isConnected ? `${Number(points).toLocaleString()} XP` : "—"}
            sub="🏆 Gold Level"
            icon={Award}
          />
          <StatCard
            title="Staked Amount"
            value={isConnected ? stakedFormatted.split(" ")[0] ?? "0" : "—"}
            sub="APR 12.35%"
            icon={Coins}
          />
          <StatCard
            title="Rewards Earned"
            value={isConnected ? "128.45" : "—"}
            sub={isConnected ? "$108.12" : "—"}
            icon={TrendingUp}
            trend="up"
          />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Quick Actions</h2>
          <QuickActions />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PortfolioChart />
          <PointsProgress points={pts} level="Gold" />
        </div>

        <RecentTxs connected={isConnected} />
      </div>
    </>
  );
}
