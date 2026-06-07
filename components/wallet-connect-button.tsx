"use client";

import { useAccount, useBalance, useConnect, useDisconnect, useChainId } from "wagmi";
import { iopnTestnet } from "@/lib/chains";
import { Button } from "@/components/ui/button";

function shortAddr(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });

  const wrongNetwork = isConnected && chainId !== iopnTestnet.id;

  if (!isConnected) {
    return (
      <Button
        className="glow-primary bg-gradient-to-r from-primary to-primary/80"
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending || connectors.length === 0}
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden rounded-lg border border-white/10 bg-secondary/50 px-3 py-2 text-xs md:block">
        <div className="font-medium">{shortAddr(address)}</div>
        <div className="text-muted-foreground">
          {balance ? `${Number(balance.formatted).toFixed(2)} ${balance.symbol}` : "—"}
          {wrongNetwork ? " • Wrong network" : ""}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => disconnect()}>
        Disconnect
      </Button>
    </div>
  );
}
