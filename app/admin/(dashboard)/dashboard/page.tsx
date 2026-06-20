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
  const { adminFetch } = useAdminCsrf();
  const [fees, setFees] = React.useState<FeeSnapshot | null>(null);
  const [swapFeeBps, setSwapFeeBps] = React.useState("30");
  const [multisendFeeBps, setMultisendFeeBps] = React.useState("0");
  const [stakingFeeBps, setStakingFeeBps] = React.useState("0");
  const [status, setStatus] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const loadFees = React.useCallback(async () => {
    const res = await fetch("/api/admin/fees");
    const json = await res.json();
    if (json.fees) {
      setFees(json.fees);
      setSwapFeeBps(String(json.fees.swapFeeBps));
      setMultisendFeeBps(String(json.fees.multisendFeeBps));
      setStakingFeeBps(String(json.fees.stakingFeeBps));
    }
  }, []);

  React.useEffect(() => {
    loadFees();
  }, [loadFees]);

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
        <p className="text-sm text-muted-foreground">Protocol fee controls and overview.</p>
      </div>

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
