"use client";

import * as React from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { AppShellBar } from "@/components/layout/app-shell-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useStaking } from "@/lib/hooks/useStaking";

export default function StakePage() {
  const { isConnected } = useAccount();
  const [stakeAmount, setStakeAmount] = React.useState("10");
  const [unstakeAmount, setUnstakeAmount] = React.useState("");
  const {
    tokenSymbol,
    isLpStakingToken,
    tokenDecimals,
    stakedRaw,
    stakedAmount,
    stakedFormatted,
    walletBalanceRaw,
    walletBalanceFormatted,
    totalStakedFormatted,
    needsApproval,
    pendingApproval,
    stake,
    unstake,
    isPending,
    error
  } = useStaking();

  const stakeAmountWei = React.useMemo(() => {
    try {
      return parseUnits(stakeAmount || "0", tokenDecimals);
    } catch {
      return 0n;
    }
  }, [stakeAmount, tokenDecimals]);

  const unstakeAmountWei = React.useMemo(() => {
    try {
      return parseUnits(unstakeAmount || "0", tokenDecimals);
    } catch {
      return 0n;
    }
  }, [unstakeAmount, tokenDecimals]);

  const setMaxStake = () => {
    if (walletBalanceRaw > 0n) {
      setStakeAmount(formatUnits(walletBalanceRaw, tokenDecimals));
    }
  };

  const setMaxUnstake = () => {
    if (stakedRaw > 0n) {
      setUnstakeAmount(formatUnits(stakedRaw, tokenDecimals));
    }
  };

  return (
    <>
      <AppShellBar title="Stake" subtitle="Stake tokens and earn rewards + points." />
      <div className="mx-auto grid max-w-4xl gap-6 p-4 md:p-8 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <Badge className="mb-4">APR 12.35%</Badge>
          <h3 className="text-lg font-semibold">Stake {tokenSymbol}</h3>
          <p className="text-sm text-muted-foreground">Total protocol staked: {totalStakedFormatted}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pool token balance: {isConnected ? walletBalanceFormatted : "—"}
          </p>
          {isConnected && walletBalanceRaw === 0n ? (
            <p className="mt-1 text-xs text-amber-400">
              {isLpStakingToken
                ? "You need LP TOKEN in your wallet to stake."
                : `You need ${tokenSymbol} in your wallet to stake.`}
            </p>
          ) : null}

          <div className="mt-6 grid gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label>Amount ({tokenSymbol})</Label>
                <button
                  type="button"
                  onClick={setMaxStake}
                  disabled={!isConnected || walletBalanceRaw === 0n}
                  className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Max
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <Input value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
                <span className="flex h-10 items-center rounded-md border border-border bg-secondary px-3 text-sm font-medium">
                  {tokenSymbol}
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-white/5 bg-secondary/30 p-3 text-sm">
              <div className="text-muted-foreground">Estimated rewards (30d)</div>
              <div className="font-semibold text-emerald-400">
                ~{(Number(stakeAmount) * 0.1235 * 0.25).toFixed(4)} {tokenSymbol}
              </div>
            </div>
            <Button
              size="lg"
              className="w-full"
              disabled={!isConnected || isPending || stakeAmountWei === 0n || stakeAmountWei > walletBalanceRaw}
              onClick={() => stake(stakeAmountWei)}
            >
              {isConnected
                ? isPending
                  ? pendingApproval
                    ? "Approving…"
                    : "Staking…"
                  : needsApproval(stakeAmountWei)
                    ? `Approve ${tokenSymbol}`
                    : `Stake ${tokenSymbol}`
                : "Connect Wallet"}
            </Button>
            {error ? <p className="text-center text-xs text-destructive">{error}</p> : null}
            <p className="text-center text-xs text-muted-foreground">+25 points per stake</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold">My Stakes</h3>
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="text-sm text-muted-foreground">Staked ({tokenSymbol})</div>
              <div className="text-3xl font-bold">
                {isConnected ? (
                  <>
                    {stakedAmount}{" "}
                    <span className="text-lg font-semibold text-muted-foreground">{tokenSymbol}</span>
                  </>
                ) : (
                  "—"
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{stakedFormatted}</div>
              <div className="mt-2 text-sm text-emerald-400">Rewards: 12.45 {tokenSymbol}</div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Unstake amount</Label>
                {isConnected && stakedRaw > 0n ? (
                  <button
                    type="button"
                    onClick={setMaxUnstake}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Max
                  </button>
                ) : null}
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="0.0"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                />
                <span className="flex h-10 items-center rounded-md border border-border bg-secondary px-3 text-sm font-medium">
                  {tokenSymbol}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Available to unstake: {isConnected ? `${stakedAmount} ${tokenSymbol}` : "—"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" disabled={!isConnected}>
                Claim
              </Button>
              <Button
                variant="outline"
                disabled={
                  !isConnected ||
                  isPending ||
                  unstakeAmountWei === 0n ||
                  unstakeAmountWei > stakedRaw
                }
                onClick={() => unstake(unstakeAmountWei)}
              >
                {isPending ? "Unstaking…" : `Unstake ${tokenSymbol}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
