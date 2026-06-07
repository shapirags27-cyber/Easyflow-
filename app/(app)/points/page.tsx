"use client";

import * as React from "react";
import { useAccount } from "wagmi";
import { AppShellBar } from "@/components/layout/app-shell-bar";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useLeaderboard, usePoints } from "@/lib/hooks/usePoints";

export default function PointsPage() {
  const { isConnected } = useAccount();
  const { points } = usePoints();
  const { leaderboard, refresh, isLoading } = useLeaderboard();
  const pts = Number(points) || 0;

  React.useEffect(() => {
    if (isConnected) refresh();
  }, [isConnected, refresh]);

  return (
    <>
      <AppShellBar title="Points & Rewards" subtitle="Earn XP from swaps, staking, and more." />
      <div className="space-y-6 p-4 md:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass rounded-2xl p-6 lg:col-span-1">
            <Badge>Gold Level</Badge>
            <div className="mt-4 text-4xl font-bold">{isConnected ? pts.toLocaleString() : "—"}</div>
            <div className="text-sm text-muted-foreground">Total XP</div>
            <div className="mt-6">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress to Platinum</span>
                <span>{pts} / 6000</span>
              </div>
              <ProgressBar value={pts} max={6000} className="mt-2" />
            </div>
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Swap</span>
                <span className="text-primary">+15 XP</span>
              </div>
              <div className="flex justify-between">
                <span>Stake</span>
                <span className="text-primary">+25 XP</span>
              </div>
              <div className="flex justify-between">
                <span>Multi-Send</span>
                <span className="text-primary">+10 XP</span>
              </div>
              <div className="flex justify-between">
                <span>Add Liquidity</span>
                <span className="text-primary">+30 XP</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 lg:col-span-2">
            <h3 className="font-semibold">Points over time</h3>
            <div className="mt-6 flex h-40 items-end gap-2">
              {[20, 35, 28, 45, 60, 55, 70, 85, 78, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-primary/80 to-accent/60"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold">Leaderboard</h3>
          <p className="text-sm text-muted-foreground">Top users by on-chain points</p>
          <div className="mt-4">
            {isLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-muted-foreground">No entries yet. Be the first to earn points!</p>
            ) : (
              <div className="divide-y divide-white/5">
                {leaderboard.map((row, idx) => (
                  <div key={row.user} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          idx === 0
                            ? "bg-amber-500/20 text-amber-400"
                            : idx === 1
                              ? "bg-slate-400/20 text-slate-300"
                              : idx === 2
                                ? "bg-orange-600/20 text-orange-400"
                                : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-mono text-xs">{row.user}</span>
                    </div>
                    <span className="font-semibold text-primary">{row.points} XP</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
