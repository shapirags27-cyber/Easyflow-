"use client";

import * as React from "react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { AppShellBar } from "@/components/layout/app-shell-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useStaking } from "@/lib/hooks/useStaking";

export default function StakePage() {
  const { isConnected } = useAccount();
  const [amount, setAmount] = React.useState("10");
  const { tokenSymbol, tokenDecimals, stakedFormatted, totalStakedFormatted, stake, unstake, isPending } =
    useStaking();

  const amountWei = React.useMemo(() => {
    try {
      return parseUnits(amount || "0", tokenDecimals);
    } catch {
      return 0n;
    }
  }, [amount, tokenDecimals]);

  return (
    <>
      <AppShellBar title="Stake" subtitle="Stake tokens and earn rewards + points." />
      <div className="mx-auto grid max-w-4xl gap-6 p-4 md:p-8 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <Badge className="mb-4">APR 12.35%</Badge>
          <h3 className="text-lg font-semibold">Stake {tokenSymbol}</h3>
          <p className="text-sm text-muted-foreground">Total protocol staked: {totalStakedFormatted}</p>

          <div className="mt-6 grid gap-4">
            <div>
              <Label>Amount</Label>
              <Input className="mt-2" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="rounded-lg border border-white/5 bg-secondary/30 p-3 text-sm">
              <div className="text-muted-foreground">Estimated rewards (30d)</div>
              <div className="font-semibold text-emerald-400">
                ~{(Number(amount) * 0.1235 * 0.25).toFixed(2)} {tokenSymbol}
              </div>
            </div>
            <Button
              size="lg"
              className="w-full"
              disabled={!isConnected || isPending || amountWei === 0n}
              onClick={() => stake(amountWei)}
            >
              {isConnected ? (isPending ? "Staking…" : "Stake Now") : "Connect Wallet"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">+25 points per stake</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold">My Stakes</h3>
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="text-sm text-muted-foreground">Staked</div>
              <div className="text-3xl font-bold">{isConnected ? stakedFormatted : "—"}</div>
              <div className="mt-2 text-sm text-emerald-400">Rewards: 12.45 {tokenSymbol}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" disabled={!isConnected}>
                Claim
              </Button>
              <Button
                variant="outline"
                disabled={!isConnected || isPending || amountWei === 0n}
                onClick={() => unstake(amountWei)}
              >
                Unstake
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
