"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminCsrf } from "@/lib/hooks/useAdminCsrf";

export default function AdminPointsPage() {
  const { adminFetch } = useAdminCsrf();
  const [wallet, setWallet] = React.useState("");
  const [delta, setDelta] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [total, setTotal] = React.useState<number | null>(null);
  const [status, setStatus] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function lookup() {
    if (!wallet) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/points?wallet=${encodeURIComponent(wallet)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTotal(data.totalForWallet ?? 0);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  async function adjust(sign: 1 | -1) {
    setLoading(true);
    setStatus("");
    try {
      const res = await adminFetch("/api/admin/points", {
        method: "POST",
        body: JSON.stringify({
          wallet,
          delta: sign * Math.abs(Number(delta)),
          reason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTotal(data.totalForWallet);
      setStatus(`Adjusted ${sign > 0 ? "+" : ""}${sign * Math.abs(Number(delta))} points.`);
      setDelta("");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Adjustment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Points</h1>
        <p className="text-sm text-muted-foreground">
          Add or remove platform points for a wallet address.
        </p>
      </div>

      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle>Adjust points</CardTitle>
          <CardDescription>Changes are logged in the admin audit trail.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 max-w-lg">
          <div className="grid gap-2">
            <Label>Wallet address</Label>
            <Input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x…"
            />
          </div>
          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input
              type="number"
              min={1}
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="25"
            />
          </div>
          <div className="grid gap-2">
            <Label>Reason (optional)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={loading} onClick={() => void lookup()}>
              Lookup balance
            </Button>
            <Button disabled={loading || !delta} onClick={() => void adjust(1)}>
              Add points
            </Button>
            <Button variant="destructive" disabled={loading || !delta} onClick={() => void adjust(-1)}>
              Remove points
            </Button>
          </div>

          {total !== null ? (
            <p className="text-sm">
              Admin-adjusted total: <span className="font-semibold text-primary">{total}</span>
            </p>
          ) : null}
          {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
