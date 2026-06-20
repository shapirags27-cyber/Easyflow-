"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCsrf } from "@/lib/hooks/useAdminCsrf";

type AnalyticsData = {
  dbConnected: boolean;
  platform: {
    tvl: string;
    totalStaked: string;
    totalSwapped: string;
    pointsDistributed: string;
  } | null;
  counts: {
    pointAdjustments: number;
    adminActivityLogs: number;
    userTransactions: number;
  };
  leaderboard: { wallet: string; onChainPoints: string }[];
  recentAdminActivity: {
    id: string;
    action: string;
    createdAt: string;
    admin: { email: string } | null;
  }[];
};

function shortWallet(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function AdminAnalyticsPage() {
  const { adminGet } = useAdminCsrf();
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    void adminGet("/api/admin/analytics")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load analytics"));
  }, [adminGet]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Platform metrics, on-chain leaderboard, and admin activity.</p>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="glass border-white/5">
              <CardHeader className="pb-2">
                <CardDescription>TVL</CardDescription>
                <CardTitle className="text-xl">{data.platform?.tvl ?? "—"}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="glass border-white/5">
              <CardHeader className="pb-2">
                <CardDescription>Total staked</CardDescription>
                <CardTitle className="text-xl">{data.platform?.totalStaked ?? "—"}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="glass border-white/5">
              <CardHeader className="pb-2">
                <CardDescription>Total swapped</CardDescription>
                <CardTitle className="text-xl">{data.platform?.totalSwapped ?? "—"}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="glass border-white/5">
              <CardHeader className="pb-2">
                <CardDescription>Points distributed</CardDescription>
                <CardTitle className="text-xl">{data.platform?.pointsDistributed ?? "—"}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="glass border-white/5">
              <CardHeader className="pb-2">
                <CardDescription>User transactions</CardDescription>
                <CardTitle>{data.counts.userTransactions}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="glass border-white/5">
              <CardHeader className="pb-2">
                <CardDescription>Point adjustments</CardDescription>
                <CardTitle>{data.counts.pointAdjustments}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="glass border-white/5">
              <CardHeader className="pb-2">
                <CardDescription>Admin audit logs</CardDescription>
                <CardTitle>{data.counts.adminActivityLogs}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {!data.dbConnected ? (
            <p className="text-sm text-amber-500">Database not connected — counts may be unavailable.</p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="glass border-white/5">
              <CardHeader>
                <CardTitle>On-chain leaderboard</CardTitle>
                <CardDescription>Top wallets by PointsManager score.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leaderboard data.</p>
                ) : (
                  <div className="space-y-2">
                    {data.leaderboard.map((row, i) => (
                      <div key={row.wallet} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-xs">
                          #{i + 1} {shortWallet(row.wallet)}
                        </span>
                        <span className="font-semibold">{row.onChainPoints}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass border-white/5">
              <CardHeader>
                <CardTitle>Recent admin activity</CardTitle>
                <CardDescription>Latest actions from authenticated admins.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.recentAdminActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No admin activity yet.</p>
                ) : (
                  <div className="space-y-3">
                    {data.recentAdminActivity.map((log) => (
                      <div key={log.id} className="text-sm border-b border-white/5 pb-2">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium">{log.action}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{log.admin?.email ?? "system"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
