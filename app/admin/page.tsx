"use client";

import * as React from "react";
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useWaitForTransactionReceipt
} from "wagmi";
import type { Hex } from "viem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppShellBar } from "@/components/layout/app-shell-bar";
import { ADMIN_ADDRESS } from "@/lib/admin";
import { buildFeeUpdateMessage } from "@/lib/admin-messages";

type FeeSnapshot = {
  swapFeeBps: number;
  multisendFeeBps: number;
  stakingFeeBps: number;
  feeRecipient: string;
  feeBase: number;
};

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const isAdmin = Boolean(address && address.toLowerCase() === ADMIN_ADDRESS.toLowerCase());

  const [fees, setFees] = React.useState<FeeSnapshot | null>(null);
  const [swapFeeBps, setSwapFeeBps] = React.useState("30");
  const [multisendFeeBps, setMultisendFeeBps] = React.useState("0");
  const [stakingFeeBps, setStakingFeeBps] = React.useState("0");
  const [status, setStatus] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  const { sendTransaction, data: hash, isPending } = useSendTransaction();
  const { signMessageAsync } = useSignMessage();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

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
    if (!isAdmin || !address) return;
    setLoading(true);
    setStatus("");
    try {
      const timestamp = Date.now();
      const payload = {
        swapFeeBps: Number(swapFeeBps),
        multisendFeeBps: Number(multisendFeeBps),
        stakingFeeBps: Number(stakingFeeBps),
        timestamp
      };
      const message = buildFeeUpdateMessage(payload);

      const signature = (await signMessageAsync({ message })) as Hex;

      const res = await fetch("/api/admin/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, signature })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");

      if (json.mode === "server-submitted") {
        setStatus(`Fees updated on-chain. Tx: ${json.txHash}`);
        await loadFees();
        return;
      }

      if (json.transaction) {
        sendTransaction({
          to: json.transaction.to,
          data: json.transaction.data
        });
        setStatus("Submitting fee update transaction…");
        return;
      }

      setStatus("Fees validated by backend.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (hash && !isConfirming && !isPending) {
      setStatus(`Fees updated. Tx: ${hash}`);
      loadFees();
    }
  }, [hash, isConfirming, isPending, loadFees]);

  return (
    <>
      <AppShellBar
        title="Admin Backend"
        subtitle="Fee controls via /api/admin/fees — enforced on-chain by ProtocolFees."
      />
      <div className="mx-auto grid max-w-2xl gap-6 p-4 md:p-8">
      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle>Access</CardTitle>
          <CardDescription>Admin wallet: {ADMIN_ADDRESS}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>Connected: {isConnected ? "Yes" : "No"}</div>
          <div>Is admin: {isAdmin ? "Yes" : "No"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Protocol Fees (bps)</CardTitle>
          <CardDescription>
            Swap, Multi-Send, and Staking fees. Max 1000 bps (10%). Current on-chain values loaded
            from backend.
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

          <Button
            disabled={!isAdmin || loading || isPending || isConfirming}
            onClick={updateFees}
          >
            {loading || isPending || isConfirming ? "Updating…" : "Update fees via backend"}
          </Button>

          {status ? <div className="text-xs text-muted-foreground">{status}</div> : null}
        </CardContent>
      </Card>
      </div>
    </>
  );
}
