"use client";

import * as React from "react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { AppShellBar } from "@/components/layout/app-shell-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePools } from "@/lib/hooks/usePools";

export default function PoolsPage() {
  const { isConnected } = useAccount();
  const [amountA, setAmountA] = React.useState("100");
  const [amountB, setAmountB] = React.useState("100");
  const { addLiquidity, isPending } = usePools();

  const submit = () => {
    const a = parseUnits(amountA || "0", 18);
    const b = parseUnits(amountB || "0", 18);
    addLiquidity(a, b);
  };

  return (
    <>
      <AppShellBar title="Pools" subtitle="Add liquidity and earn trading fees." />
      <div className="mx-auto grid max-w-4xl gap-6 p-4 md:p-8 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold">Add Liquidity</h3>
          <p className="text-sm text-muted-foreground">Token A / Token B pair</p>
          <div className="mt-6 grid gap-4">
            <div>
              <Label>Token A amount</Label>
              <Input className="mt-2" value={amountA} onChange={(e) => setAmountA(e.target.value)} />
            </div>
            <div>
              <Label>Token B amount</Label>
              <Input className="mt-2" value={amountB} onChange={(e) => setAmountB(e.target.value)} />
            </div>
            <Button size="lg" disabled={!isConnected || isPending} onClick={submit}>
              {isPending ? "Adding…" : "Add Liquidity"}
            </Button>
            <p className="text-xs text-muted-foreground">+30 points when liquidity is added</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold">Your Position</h3>
          <div className="mt-6 space-y-4">
            <div className="flex justify-between rounded-lg border border-white/5 p-4">
              <span className="text-muted-foreground">Pool share</span>
              <span className="font-semibold">—</span>
            </div>
            <div className="flex justify-between rounded-lg border border-white/5 p-4">
              <span className="text-muted-foreground">Fees earned (24h)</span>
              <span className="font-semibold text-emerald-400">0.00 OPN</span>
            </div>
            <div className="flex justify-between rounded-lg border border-white/5 p-4">
              <span className="text-muted-foreground">LP tokens</span>
              <span className="font-semibold">—</span>
            </div>
            <Button variant="outline" className="w-full" disabled>
              Remove Liquidity
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
