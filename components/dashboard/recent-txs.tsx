"use client";

import * as React from "react";
import { useAccount } from "wagmi";

type TxRow = {
  type: string;
  amount: string;
  positive: boolean;
  time: string;
};

const fallbackTxs: TxRow[] = [
  { type: "Staked OPN", amount: "+50.00", positive: true, time: "2h ago" },
  { type: "Multi-Send", amount: "-0.50", positive: false, time: "5h ago" },
  { type: "Swap OPN → A", amount: "-120.00", positive: false, time: "8h ago" }
];

export function RecentTxs({ connected }: { connected: boolean }) {
  const { address } = useAccount();
  const [txs, setTxs] = React.useState<TxRow[]>([]);
  const [source, setSource] = React.useState<"loading" | "database" | "fallback">("loading");

  React.useEffect(() => {
    if (!connected || !address) {
      setTxs([]);
      setSource("fallback");
      return;
    }

    fetch(`/api/transactions?wallet=${address}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.transactions?.length) {
          setTxs(data.transactions);
          setSource(data.source === "database" ? "database" : "fallback");
        } else {
          setTxs(fallbackTxs);
          setSource("fallback");
        }
      })
      .catch(() => {
        setTxs(fallbackTxs);
        setSource("fallback");
      });
  }, [connected, address]);

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Recent Transactions</h3>
        {source === "database" ? (
          <span className="text-xs text-emerald-400">Live from DB</span>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">Latest activity</p>
      <div className="mt-4 space-y-3">
        {!connected ? (
          <p className="text-sm text-muted-foreground">Connect wallet to see activity.</p>
        ) : txs.length === 0 && source === "loading" ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          txs.map((tx, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-secondary/30 px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium">{tx.type}</div>
                <div className="text-xs text-muted-foreground">{tx.time}</div>
              </div>
              <span
                className={
                  tx.positive
                    ? "text-sm font-medium text-emerald-400"
                    : "text-sm font-medium text-red-400"
                }
              >
                {tx.amount}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
