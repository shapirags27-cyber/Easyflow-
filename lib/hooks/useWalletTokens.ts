"use client";

import * as React from "react";
import { useAccount } from "wagmi";
import { getSwapTokens, mergeTokenLists, type Token } from "@/lib/tokens";

export function useWalletTokens(enabled = true) {
  const { address, isConnected } = useAccount();
  const [walletTokens, setWalletTokens] = React.useState<Token[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!address) {
      setWalletTokens([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/wallet-tokens?wallet=${address}`);
      const data = (await res.json()) as { tokens?: Token[] };
      setWalletTokens(data.tokens ?? []);
    } catch {
      setWalletTokens([]);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  React.useEffect(() => {
    if (!enabled || !isConnected || !address) {
      setWalletTokens([]);
      return;
    }
    void refresh();
  }, [enabled, isConnected, address, refresh]);

  const catalog = React.useMemo(
    () => mergeTokenLists(walletTokens, getSwapTokens()),
    [walletTokens]
  );

  return { walletTokens, catalog, isLoading, refresh, isConnected };
}
