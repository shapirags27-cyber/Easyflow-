"use client";

import { useAccount, useDisconnect } from "wagmi";
import { Copy, LogOut } from "lucide-react";

function shortAddr(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function AppShellBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const copy = () => {
    if (address) navigator.clipboard.writeText(address);
  };

  return (
    <div className="flex flex-col gap-1 px-4 py-6 sm:flex-row sm:items-start sm:justify-between md:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {isConnected && address ? (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-card/60 px-3 py-2">
          <span className="font-mono text-sm">{shortAddr(address)}</span>
          <button
            type="button"
            onClick={copy}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            aria-label="Copy address"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => disconnect()}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-red-400"
            aria-label="Disconnect"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
