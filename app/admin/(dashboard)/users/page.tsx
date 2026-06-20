"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAdminCsrf } from "@/lib/hooks/useAdminCsrf";

type Activity = {
  id: string;
  wallet: string;
  type: string;
  amount: string;
  positive: boolean;
  txHash: string | null;
  createdAt: string;
};

function shortWallet(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function AdminUsersPage() {
  const { adminFetch, adminGet } = useAdminCsrf();
  const [wallet, setWallet] = React.useState("");
  const [transactions, setTransactions] = React.useState<Activity[]>([]);
  const [recentActivity, setRecentActivity] = React.useState<Activity[]>([]);
  const [wallets, setWallets] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const loadOverview = React.useCallback(async () => {
    const res = await adminGet("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setWallets(data.wallets ?? []);
      setRecentActivity(data.recentActivity ?? []);
    }
  }, [adminGet]);

  React.useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  async function searchWallet() {
    if (!wallet) return;
    setLoading(true);
    setStatus("");
    try {
      const res = await adminGet(`/api/admin/users?wallet=${encodeURIComponent(wallet)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTransactions(data.transactions ?? []);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function deleteActivity(id: string) {
    if (!confirm("Remove this activity record from the system?")) return;
    setLoading(true);
    setStatus("");
    try {
      const res = await adminFetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus("Activity removed.");
      if (wallet) await searchWallet();
      else await loadOverview();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  async function clearWalletActivity() {
    if (!wallet || !confirm(`Clear all activity records for ${wallet}?`)) return;
    setLoading(true);
    setStatus("");
    try {
      const res = await adminFetch(
        `/api/admin/users?wallet=${encodeURIComponent(wallet)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(`Removed ${data.deleted} activity record(s).`);
      await searchWallet();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Clear failed");
    } finally {
      setLoading(false);
    }
  }

  const displayRows = wallet && transactions.length > 0 ? transactions : recentActivity;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Wallet activity from transaction logs. End users authenticate via wallet connection only — no wallet-based admin access.
        </p>
      </div>

      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle>Search wallet</CardTitle>
          <CardDescription>View and manage logged activity for a wallet address.</CardDescription>
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
          <div className="flex flex-wrap gap-2">
            <Button disabled={loading || !wallet} onClick={() => void searchWallet()}>
              Search activity
            </Button>
            {wallet ? (
              <Button variant="outline" disabled={loading} onClick={() => void clearWalletActivity()}>
                Clear wallet activity
              </Button>
            ) : null}
          </div>
          {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
        </CardContent>
      </Card>

      {wallets.length > 0 && !wallet ? (
        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle>Recent wallets</CardTitle>
            <CardDescription>Wallets with recent platform activity.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {wallets.map((w) => (
              <Button
                key={w}
                variant="secondary"
                size="sm"
                className="font-mono text-xs"
                onClick={() => {
                  setWallet(w);
                  void adminGet(`/api/admin/users?wallet=${encodeURIComponent(w)}`).then(async (res) => {
                    if (res.ok) {
                      const data = await res.json();
                      setTransactions(data.transactions ?? []);
                    }
                  });
                }}
              >
                {shortWallet(w)}
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle>Activity log</CardTitle>
          <CardDescription>
            {wallet && transactions.length > 0
              ? `Activity for ${shortWallet(wallet)}`
              : "Recent platform activity"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Wallet</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Amount</th>
                    <th className="pb-2 pr-4 font-medium">Tx</th>
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => (
                    <tr key={row.id} className="border-b border-white/5">
                      <td className="py-2 pr-4 font-mono text-xs">{shortWallet(row.wallet)}</td>
                      <td className="py-2 pr-4">{row.type}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={row.positive ? "success" : "outline"}>{row.amount}</Badge>
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                        {row.txHash ? shortWallet(row.txHash) : "—"}
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loading}
                          onClick={() => void deleteActivity(row.id)}
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
