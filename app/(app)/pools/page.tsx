"use client";

import * as React from "react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { AppShellBar } from "@/components/layout/app-shell-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePools } from "@/lib/hooks/usePools";
import { getUniqueTokens } from "@/lib/tokens";

const poolTokens = getUniqueTokens();

export default function PoolsPage() {
  const { isConnected } = useAccount();
  const [token0Sym, setToken0Sym] = React.useState("OPN");
  const [token1Sym, setToken1Sym] = React.useState("tUSDT");
  const [amount0, setAmount0] = React.useState("100");
  const [amount1, setAmount1] = React.useState("100");
  const { decimals0, decimals1, addLiquidity, isPending, canAdd } = usePools(token0Sym, token1Sym);

  const submit = () => {
    const a = parseUnits(amount0 || "0", decimals0);
    const b = parseUnits(amount1 || "0", decimals1);
    addLiquidity(a, b);
  };

  return (
    <>
      <AppShellBar title="Pools" subtitle="Add liquidity and earn trading fees." />
      <div className="mx-auto grid max-w-4xl gap-6 p-4 md:p-8 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold">Add Liquidity</h3>
          <p className="text-sm text-muted-foreground">
            {token0Sym} / {token1Sym} pair
          </p>
          <div className="mt-6 grid gap-4">
            <div>
              <Label>{token0Sym} amount</Label>
              <div className="mt-2 flex gap-2">
                <Input value={amount0} onChange={(e) => setAmount0(e.target.value)} />
                <select
                  className="rounded-lg border bg-card px-3 text-sm"
                  value={token0Sym}
                  onChange={(e) => setToken0Sym(e.target.value)}
                >
                  {poolTokens.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>{token1Sym} amount</Label>
              <div className="mt-2 flex gap-2">
                <Input value={amount1} onChange={(e) => setAmount1(e.target.value)} />
                <select
                  className="rounded-lg border bg-card px-3 text-sm"
                  value={token1Sym}
                  onChange={(e) => setToken1Sym(e.target.value)}
                >
                  {poolTokens.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button size="lg" disabled={!isConnected || isPending || !canAdd} onClick={submit}>
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
