"use client";

import { useAccount } from "wagmi";
import { AppShellBar } from "@/components/layout/app-shell-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

const markets = [
  { asset: "OPN", supplyApy: "8.2%", borrowApy: "12.4%" },
  { asset: "USDC", supplyApy: "5.1%", borrowApy: "9.8%" },
  { asset: "wOPN", supplyApy: "7.5%", borrowApy: "11.2%" }
];

export default function BorrowPage() {
  const { isConnected } = useAccount();
  const health = 2.35;

  return (
    <>
      <AppShellBar title="Borrow / Lend" subtitle="Collateralized lending markets (preview)." />
      <div className="space-y-6 p-4 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Your Collateral", value: isConnected ? "1,250 OPN" : "—" },
            { label: "Borrow Power", value: isConnected ? "875 OPN" : "—" },
            { label: "Borrowed", value: isConnected ? "320 OPN" : "—" },
            {
              label: "Health Factor",
              value: isConnected ? health.toFixed(2) : "—",
              badge: health > 1.5 ? "Healthy" : "At Risk"
            }
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-5">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl font-bold">{s.value}</span>
                {s.badge ? <Badge variant="success">{s.badge}</Badge> : null}
              </div>
            </div>
          ))}
        </div>

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
                  <tr key={m.asset} className="border-b border-white/5">
                    <td className="py-4 font-medium">{m.asset}</td>
                    <td className="py-4 text-emerald-400">{m.supplyApy}</td>
                    <td className="py-4 text-amber-400">{m.borrowApy}</td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" disabled={!isConnected}>
                          Supply
                        </Button>
                        <Button size="sm" variant="outline" disabled={!isConnected}>
                          Borrow
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Lending contracts coming soon — UI preview aligned with design mockup.
          </p>
        </div>

        <div className="glass max-w-md rounded-xl p-5">
          <div className="text-sm text-muted-foreground">Liquidation threshold</div>
          <ProgressBar value={health > 2 ? 75 : 40} className="mt-2" />
        </div>
      </div>
    </>
  );
}
