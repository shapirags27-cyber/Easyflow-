"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminCsrf } from "@/lib/hooks/useAdminCsrf";

type FeeSnapshot = {
  swapFeeBps: number;
  multisendFeeBps: number;
  stakingFeeBps: number;
  feeRecipient: string;
  feeBase: number;
};

export default function AdminDashboardPage() {
  const { adminFetch, adminGet } = useAdminCsrf();
  const [fees, setFees] = React.useState<FeeSnapshot | null>(null);
  const [overview, setOverview] = React.useState<{
    tvl: string;
    userTransactions: number;
    pointAdjustments: number;
  } | null>(null);
  const [swapFeeBps, setSwapFeeBps] = React.useState("30");
  const [multisendFeeBps, setMultisendFeeBps] = React.useState("0");
  const [stakingFeeBps, setStakingFeeBps] = React.useState("0");
  const [status, setStatus] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const loadFees = React.useCallback(async () => {
    const res = await adminGet("/api/admin/fees");
    const json = await res.json();
    if (json.fees) {
      setFees(json.fees);
      setSwapFeeBps(String(json.fees.swapFeeBps));
      setMultisendFeeBps(String(json.fees.multisendFeeBps));
      setStakingFeeBps(String(json.fees.stakingFeeBps));
    }
  }, [adminGet]);

  const loadOverview = React.useCallback(async () => {
    const res = await adminGet("/api/admin/analytics");
    if (res.ok) {
      const json = await res.json();
      setOverview({
        tvl: json.platform?.tvl ?? "—",
        userTransactions: json.counts?.userTransactions ?? 0,
        pointAdjustments: json.counts?.pointAdjustments ?? 0
      });
    }
  }, [adminGet]);

  React.useEffect(() => {
    void loadFees();
    void loadOverview();
  }, [loadFees, loadOverview]);

  async function updateFees() {
    setLoading(true);
    setStatus("");
    try {
      const res = await adminFetch("/api/admin/fees", {
        method: "POST",
        body: JSON.stringify({
          swapFeeBps: Number(swapFeeBps),
          multisendFeeBps: Number(multisendFeeBps),
          stakingFeeBps: Number(stakingFeeBps)
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      setStatus(json.mode === "server-submitted" ? `Fees updated. Tx: ${json.txHash}` : "Fees updated.");
      await loadFees();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Protocol fee controls and platform overview.</p>
      </div>

      {overview ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="glass border-white/5">
            <CardHeader className="pb-2">
              <CardDescription>TVL</CardDescription>
              <CardTitle className="text-xl">{overview.tvl}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass border-white/5">
            <CardHeader className="pb-2">
              <CardDescription>User transactions</CardDescription>
              <CardTitle className="text-xl">{overview.userTransactions}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass border-white/5">
            <CardHeader className="pb-2">
              <CardDescription>Point adjustments</CardDescription>
              <CardTitle className="text-xl">{overview.pointAdjustments}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : null}

      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle>Protocol Fees (bps)</CardTitle>
          <CardDescription>
            Swap, Multi-Send, and Staking fees. Max 1000 bps (10%).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {fees && (
            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              Live: swap {fees.swapFeeBps} • multisend {fees.multisendFeeBps} • staking{" "}
              {fees.stakingFeeBps} • recipient {fees.feeRecipient}
            </div>
          )}

          <div className="grid gap-2">
            <Label>Swap fee (bps)</Label>
            <Input value={swapFeeBps} onChange={(e) => setSwapFeeBps(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Multi-Send fee (bps)</Label>
            <Input value={multisendFeeBps} onChange={(e) => setMultisendFeeBps(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Staking fee (bps)</Label>
            <Input value={stakingFeeBps} onChange={(e) => setStakingFeeBps(e.target.value)} />
          </div>

          <Button disabled={loading} onClick={() => void updateFees()}>
            {loading ? "Updating…" : "Update fees"}
          </Button>
          {status ? <div className="text-xs text-muted-foreground">{status}</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
