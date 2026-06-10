"use client";

import * as React from "react";

export function useLpPairs() {
  const [pairs, setPairs] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/amm-pairs")
      .then((res) => res.json())
      .then((data: { pairs?: string[] }) => {
        if (cancelled) return;
        setPairs(new Set((data.pairs ?? []).map((p) => p.toLowerCase())));
      })
      .catch(() => {
        if (!cancelled) setPairs(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isLpPair = React.useCallback(
    (address: string) => pairs.has(address.toLowerCase()),
    [pairs]
  );

  return { pairs, isLpPair };
}
