"use client";

import * as React from "react";
import {
  useAccount,
  useBalance,
  useConnect,
  useConnectors,
  useDisconnect,
  useChainId,
  useSwitchChain
} from "wagmi";
import { iopnTestnet } from "@/lib/chains";
import { formatBalanceAmount } from "@/lib/format-balance";
import { Button } from "@/components/ui/button";

function shortAddr(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function pickConnector(connectors: ReturnType<typeof useConnectors>) {
  return (
    connectors.find((c) => c.id === "metaMask") ??
    connectors.find((c) => c.id === "injected") ??
    connectors[0]
  );
}

export function WalletConnectButton() {
  const [mounted, setMounted] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const connectors = useConnectors();
  const { connect: connectAsync, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address, chainId: iopnTestnet.id });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const wrongNetwork = isConnected && chainId !== iopnTestnet.id;
  const isPending = isConnecting || isDisconnecting || isSwitching;

  const handleConnect = async () => {
    setLocalError(null);
    const connector = pickConnector(connectors);
    if (!connector) {
      setLocalError("No wallet detected. Install MetaMask or another Web3 wallet.");
      return;
    }

    try {
      await connectAsync({ connector, chainId: iopnTestnet.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setLocalError(message);
    }
  };

  const handleSwitchNetwork = async () => {
    setLocalError(null);
    try {
      switchChain({ chainId: iopnTestnet.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to switch network";
      setLocalError(message);
    }
  };

  if (!mounted) {
    return (
      <Button className="glow-primary bg-gradient-to-r from-primary to-primary/80" disabled>
        Connect Wallet
      </Button>
    );
  }

  if (!isConnected) {
    const errorMessage = localError ?? connectError?.message;
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          className="glow-primary bg-gradient-to-r from-primary to-primary/80"
          onClick={handleConnect}
          disabled={isPending}
        >
          {isPending ? "Connecting…" : "Connect Wallet"}
        </Button>
        {errorMessage ? (
          <span className="max-w-[220px] text-right text-[10px] text-destructive">{errorMessage}</span>
        ) : null}
      </div>
    );
  }

  if (wrongNetwork) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button type="button" size="sm" onClick={handleSwitchNetwork} disabled={isPending}>
          {isPending ? "Switching…" : "Switch to IOPN"}
        </Button>
        {localError ? (
          <span className="max-w-[220px] text-right text-[10px] text-destructive">{localError}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden rounded-lg border border-white/10 bg-secondary/50 px-3 py-2 text-xs md:block">
        <div className="font-medium">{shortAddr(address)}</div>
        <div className="text-muted-foreground">
          {balance ? `${formatBalanceAmount(balance)} ${balance.symbol}` : "—"}
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => disconnect()} disabled={isPending}>
        Disconnect
      </Button>
    </div>
  );
}
