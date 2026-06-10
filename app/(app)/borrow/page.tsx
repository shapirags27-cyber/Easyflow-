"use client";

import * as React from "react";
import { useConnect, useAccount } from "wagmi";
import { AppShellBar } from "@/components/layout/app-shell-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MarketActionModal } from "@/components/borrow/market-action-modal";
import { useBorrowMarkets } from "@/lib/hooks/useBorrowMarkets";

type ModalState = {
  mode: "supply" | "borrow";
  asset: string;
  apy: string;
} | null;

export default function BorrowPage() {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const [modal, setModal] = React.useState<ModalState>(null);
  const {
    markets,
    totalSuppliedOpn,
    totalBorrowedOpn,
    borrowPower,
    healthFactor,
    supply,
    borrow,
    getBalance,
    status,
    error,
    clearMessages
  } = useBorrowMarkets();

  const openAction = (mode: "supply" | "borrow", asset: string, apy: string) => {
    clearMessages();
    if (!isConnected) {
      const connector = connectors[0];
      if (connector) connect({ connector });
      return;
    }
    setModal({ mode, asset, apy });
  };

  const handleSubmit = (amount: string) => {
    if (!modal) return;
    if (modal.mode === "supply") {
      supply(modal.asset, amount);
    } else {
      borrow(modal.asset, amount);
    }
  };

  const healthLabel =
    healthFactor >= 1.5 ? "Healthy" : healthFactor >= 1 ? "At Risk" : "Liquidatable";

  return (
    <>
      <AppShellBar title="Borrow / Lend" subtitle="Supply collateral and borrow against it." />
      <div className="space-y-6 p-4 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Your Collateral",
              value: isConnected ? `${totalSuppliedOpn.toFixed(2)} OPN eq.` : "—"
            },
            {
              label: "Borrow Power",
              value: isConnected ? `${borrowPower.toFixed(2)} OPN eq.` : "—"
            },
            {
              label: "Borrowed",
              value: isConnected ? `${totalBorrowedOpn.toFixed(2)} OPN eq.` : "—"
            },
            {
              label: "Health Factor",
              value: isConnected ? healthFactor.toFixed(2) : "—",
              badge: isConnected ? healthLabel : undefined
            }
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-5">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl font-bold">{s.value}</span>
                {s.badge ? (
                  <Badge variant={healthFactor >= 1.5 ? "success" : "warning"}>
                    {s.badge}
                  </Badge>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {(status || error) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {error ?? status}
          </div>
        )}

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold">Markets</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-muted-foreground">
                  <th className="pb-3 pr-4">Asset</th>
                  <th className="pb-3 pr-4">Supply APY</th>
                  <th className="pb-3 pr-4">Borrow APY</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {markets.map((m) => (
                  <tr key={m.symbol} className="border-b border-white/5">
                    <td className="py-4 font-medium">{m.symbol}</td>
                    <td className="py-4 text-emerald-400">{m.supplyApy}</td>
                    <td className="py-4 text-amber-400">{m.borrowApy}</td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isConnecting}
                          onClick={() => openAction("supply", m.symbol, m.supplyApy)}
                        >
                          {isConnected ? "Supply" : "Connect"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isConnecting}
                          onClick={() => openAction("borrow", m.symbol, m.borrowApy)}
                        >
                          {isConnected ? "Borrow" : "Connect"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Positions are saved locally until on-chain lending contracts deploy on IOPN testnet.
          </p>
        </div>

        <div className="glass max-w-md rounded-xl p-5">
          <div className="text-sm text-muted-foreground">Collateral usage</div>
          <ProgressBar
            value={
              isConnected && borrowPower > 0
                ? Math.min(100, (totalBorrowedOpn / borrowPower) * 100)
                : 0
            }
            className="mt-2"
          />
        </div>
      </div>

      {modal ? (
        <MarketActionModal
          open
          mode={modal.mode}
          asset={modal.asset}
          apy={modal.apy}
          balance={getBalance(modal.asset)}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  );
}
