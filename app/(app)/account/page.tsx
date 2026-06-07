"use client";

import { useAccount, useBalance } from "wagmi";
import { AppShellBar } from "@/components/layout/app-shell-bar";
import { StatCard } from "@/components/ui/stat-card";
import { Wallet, Award, Coins } from "lucide-react";
import { usePoints } from "@/lib/hooks/usePoints";
import { useStaking } from "@/lib/hooks/useStaking";
import { PointsProgress } from "@/components/dashboard/points-progress";
import { formatBalanceAmount } from "@/lib/format-balance";

export default function AccountPage() {
  const { address, isConnected } = useAccount();
  const { data: bal } = useBalance({ address });
  const { points } = usePoints();
  const { tokenSymbol, stakedFormatted, totalStakedFormatted } = useStaking();
  const pts = isConnected ? Number(points) || 0 : 0;

  return (
    <>
      <AppShellBar title="Profile" subtitle="Your wallet, staking, and rewards." />
      <div className="space-y-6 p-4 md:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Wallet"
            value={bal ? `${formatBalanceAmount(bal)} ${bal.symbol}` : "—"}
            sub={address ?? "Not connected"}
            icon={Wallet}
          />
          <StatCard title="Points" value={isConnected ? points : "—"} sub="Total XP" icon={Award} />
          <StatCard
            title="Staked"
            value={isConnected ? stakedFormatted : "—"}
            sub={`${tokenSymbol} • ${totalStakedFormatted} total`}
            icon={Coins}
          />
        </div>
        <PointsProgress points={pts} />
      </div>
    </>
  );
}
