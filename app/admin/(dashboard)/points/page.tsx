"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAdminCsrf } from "@/lib/hooks/useAdminCsrf";

type Adjustment = {
  id: string;
  wallet: string;
  delta: number;
  reason: string | null;
  createdAt: string;
  admin: { email: string };
};

function shortWallet(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function AdminPointsPage() {
  const { adminFetch, adminGet } = useAdminCsrf();
  const [wallet, setWallet] = React.useState("");
  const [delta, setDelta] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [onChainPoints, setOnChainPoints] = React.useState<string | null>(null);
  const [adminAdjustmentTotal, setAdminAdjustmentTotal] = React.useState<number | null>(null);
  const [effectiveTotal, setEffectiveTotal] = React.useState<number | null>(null);
  const [adjustments, setAdjustments] = React.useState<Adjustment[]>([]);
  const [status, setStatus] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const loadRecent = React.useCallback(async () => {
    const res = await adminGet("/api/admin/points");
    if (res.ok) {
      const data = await res.json();
      setAdjustments(data.adjustments ?? []);
    }
  }, [adminGet]);

  React.useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  async function lookup() {
    if (!wallet) return;
    setLoading(true);
    setStatus("");
    try {
      const res = await adminGet(`/api/admin/points?wallet=${encodeURIComponent(wallet)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOnChainPoints(data.onChainPoints);
      setAdminAdjustmentTotal(data.adminAdjustmentTotal);
      setEffectiveTotal(data.effectiveTotal);
      setAdjustments(data.adjustments ?? []);
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
      setOnChainPoints(data.onChainPoints);
      setAdminAdjustmentTotal(data.adminAdjustmentTotal);
      setEffectiveTotal(data.effectiveTotal);
      setStatus(`Adjusted ${sign > 0 ? "+" : ""}${sign * Math.abs(Number(delta))} points.`);
      setDelta("");
      await lookup();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Adjustment failed");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAdjustment(id: string) {
    if (!confirm("Remove this point adjustment from the system?")) return;
    setLoading(true);
    setStatus("");
    try {
      const res = await adminFetch(`/api/admin/points?id=${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus("Adjustment removed.");
      if (wallet) await lookup();
      else await loadRecent();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  async function clearWalletAdjustments() {
    if (!wallet || !confirm(`Clear all admin point adjustments for ${wallet}?`)) return;
    setLoading(true);
    setStatus("");
    try {
      const res = await adminFetch(
        `/api/admin/points?wallet=${encodeURIComponent(wallet)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(`Removed ${data.deleted} adjustment(s).`);
      await lookup();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Clear failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Points</h1>
        <p className="text-sm text-muted-foreground">
          Add or remove admin point adjustments. On-chain points are read-only; admin entries can be deleted.
        </p>
      </div>

      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle>Adjust points</CardTitle>
          <CardDescription>Changes are stored in the database and logged in the admin audit trail.</CardDescription>
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
            <Button disabled={loading || !delta || !wallet} onClick={() => void adjust(1)}>
              Add points
            </Button>
            <Button variant="destructive" disabled={loading || !delta || !wallet} onClick={() => void adjust(-1)}>
              Remove points
            </Button>
            {wallet ? (
              <Button variant="outline" disabled={loading} onClick={() => void clearWalletAdjustments()}>
                Clear wallet adjustments
              </Button>
            ) : null}
          </div>

          {effectiveTotal !== null ? (
            <div className="rounded-md border p-3 text-sm space-y-1">
              <p>
                On-chain: <span className="font-semibold">{onChainPoints}</span>
              </p>
              <p>
                Admin adjustments:{" "}
                <span className="font-semibold">{adminAdjustmentTotal ?? 0}</span>
              </p>
              <p>
                Effective total: <span className="font-semibold text-primary">{effectiveTotal}</span>
              </p>
            </div>
          ) : null}
          {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
        </CardContent>
      </Card>

      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle>Point adjustment history</CardTitle>
          <CardDescription>
            {wallet ? `Showing adjustments for ${shortWallet(wallet)}` : "Recent admin point adjustments"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adjustments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No adjustments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Wallet</th>
                    <th className="pb-2 pr-4 font-medium">Delta</th>
                    <th className="pb-2 pr-4 font-medium">Reason</th>
                    <th className="pb-2 pr-4 font-medium">Admin</th>
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {adjustments.map((row) => (
                    <tr key={row.id} className="border-b border-white/5">
                      <td className="py-2 pr-4 font-mono text-xs">{shortWallet(row.wallet)}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={row.delta >= 0 ? "success" : "warning"}>
                          {row.delta >= 0 ? "+" : ""}
                          {row.delta}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{row.reason ?? "—"}</td>
                      <td className="py-2 pr-4 text-xs">{row.admin.email}</td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loading}
                          onClick={() => void deleteAdjustment(row.id)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
