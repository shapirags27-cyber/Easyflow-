"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

/** Refetch on-chain reads when the user switches wallet accounts. */
export function AccountSync() {
  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  const prevAddress = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    const next = isConnected ? address?.toLowerCase() : undefined;
    if (prevAddress.current === next) return;
    prevAddress.current = next;
    void queryClient.invalidateQueries();
  }, [address, isConnected, queryClient]);

  return null;
}
