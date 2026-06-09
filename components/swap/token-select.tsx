"use client";

import * as React from "react";
import { ChevronDown, Search, X } from "lucide-react";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import { searchSwapTokens } from "@/lib/token-search";
import { getUniqueTokens, type Token } from "@/lib/tokens";
import { useTokenBalances } from "@/lib/hooks/useTokenBalances";
import { useTokenSymbols } from "@/lib/hooks/useTokenSymbols";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TokenSelectProps = {
  value: Address;
  onChange: (token: Token) => void;
  excludeAddress?: Address;
  className?: string;
};

export function TokenSelect({ value, onChange, excludeAddress, className }: TokenSelectProps) {
  const { isConnected } = useAccount();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [catalog, setCatalog] = React.useState<Token[]>(getUniqueTokens());
  const [loadingCatalog, setLoadingCatalog] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingCatalog(true);
    fetch("/api/tokens")
      .then((r) => r.json())
      .then((data: { tokens?: Token[] }) => {
        if (!cancelled && data.tokens?.length) {
          setCatalog(data.tokens);
        }
      })
      .catch(() => {
        /* keep static catalog */
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filteredCatalog = React.useMemo(() => {
    const list = catalog.filter(
      (t) => !excludeAddress || t.address.toLowerCase() !== excludeAddress.toLowerCase()
    );
    return list;
  }, [catalog, excludeAddress]);

  const results = React.useMemo(() => {
    const list = searchSwapTokens(query, filteredCatalog);
    return list.filter(
      (t) => !excludeAddress || t.address.toLowerCase() !== excludeAddress.toLowerCase()
    );
  }, [query, filteredCatalog, excludeAddress]);

  const resultAddresses = results.map((t) => t.address);
  const { balances } = useTokenBalances(resultAddresses);
  const onChainSymbols = useTokenSymbols(resultAddresses, open);

  const sortedResults = React.useMemo(() => {
    if (query.trim()) return results;
    return [...results].sort((a, b) => {
      const ba = balances.get(a.address.toLowerCase())?.raw ?? 0n;
      const bb = balances.get(b.address.toLowerCase())?.raw ?? 0n;
      if (ba === bb) return a.symbol.localeCompare(b.symbol);
      return ba > bb ? -1 : 1;
    });
  }, [results, balances, query]);

  const selected = React.useMemo(
    () => catalog.find((t) => t.address.toLowerCase() === value.toLowerCase()),
    [catalog, value]
  );

  const selectedBalance = balances.get(value.toLowerCase());
  const label = selected?.symbol ?? `${value.slice(0, 6)}…${value.slice(-4)}`;

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pick = (token: Token) => {
    onChange(token);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary",
          className
        )}
      >
        <span className="flex flex-col items-end leading-tight">
          <span>{label}</span>
          {isConnected && selectedBalance && selectedBalance.raw > 0n ? (
            <span className="text-[10px] font-normal text-muted-foreground">
              {selectedBalance.formatted}
            </span>
          ) : null}
        </span>
        <ChevronDown className="h-4 w-4 opacity-60" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh]">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-semibold">Select token</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, ticker, or 0x address…"
                  className="pl-9"
                />
              </div>
              {loadingCatalog ? (
                <p className="mt-2 text-xs text-muted-foreground">Loading pool tokens…</p>
              ) : null}
            </div>

            <ul className="max-h-72 overflow-y-auto p-2">
              {sortedResults.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No tokens match your search.
                </li>
              ) : (
                sortedResults.map((token) => {
                  const bal = balances.get(token.address.toLowerCase());
                  const sym =
                    onChainSymbols.get(token.address.toLowerCase()) ?? token.symbol;
                  const rowToken = { ...token, symbol: sym };
                  return (
                    <li key={token.address}>
                      <button
                        type="button"
                        onClick={() => pick(rowToken)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary",
                          token.address.toLowerCase() === value.toLowerCase() && "bg-primary/10"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="font-medium">{sym}</div>
                          <div className="truncate text-xs text-muted-foreground">{token.name}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          {isConnected ? (
                            <div className="text-sm font-medium tabular-nums">
                              {bal?.formatted ?? "0"}
                            </div>
                          ) : null}
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {token.address.slice(0, 6)}…{token.address.slice(-4)}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
