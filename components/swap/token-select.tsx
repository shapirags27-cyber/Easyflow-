"use client";

import * as React from "react";
import { ChevronDown, Search, X } from "lucide-react";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import { searchSwapTokens } from "@/lib/token-search";
import { resolveTokenSymbol, type Token } from "@/lib/tokens";
import { useWalletTokens } from "@/lib/hooks/useWalletTokens";
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
  const [picked, setPicked] = React.useState<Token | null>(null);
  const { catalog, isLoading: loadingWallet, refresh } = useWalletTokens(isConnected);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPicked(null);
  }, [value]);

  React.useEffect(() => {
    if (open && isConnected) void refresh();
  }, [open, isConnected, refresh]);

  const filteredCatalog = React.useMemo(() => {
    return catalog.filter(
      (t) => !excludeAddress || t.address.toLowerCase() !== excludeAddress.toLowerCase()
    );
  }, [catalog, excludeAddress]);

  const results = React.useMemo(() => {
    const list = searchSwapTokens(query, filteredCatalog);
    return list.filter(
      (t) => !excludeAddress || t.address.toLowerCase() !== excludeAddress.toLowerCase()
    );
  }, [query, filteredCatalog, excludeAddress]);

  const balanceAddresses = React.useMemo(() => {
    const addrs = results.map((t) => t.address);
    if (!addrs.some((a) => a.toLowerCase() === value.toLowerCase())) {
      addrs.push(value);
    }
    return addrs;
  }, [results, value]);

  const { balances } = useTokenBalances(balanceAddresses);
  const onChainSymbols = useTokenSymbols(balanceAddresses, true);
  const listSymbols = useTokenSymbols(results.map((t) => t.address), open);

  const sortedResults = React.useMemo(() => {
    return [...results].sort((a, b) => {
      const ba = balances.get(a.address.toLowerCase())?.raw ?? 0n;
      const bb = balances.get(b.address.toLowerCase())?.raw ?? 0n;
      if (ba === bb) return a.symbol.localeCompare(b.symbol);
      return ba > bb ? -1 : 1;
    });
  }, [results, balances]);

  const onChainSym = onChainSymbols.get(value.toLowerCase());
  const selectedSym =
    picked && picked.address.toLowerCase() === value.toLowerCase()
      ? picked.symbol
      : resolveTokenSymbol(value, onChainSym);

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
    const sym = resolveTokenSymbol(
      token.address,
      listSymbols.get(token.address.toLowerCase()) ?? token.symbol
    );
    const resolved = { ...token, symbol: sym };
    setPicked(resolved);
    onChange(resolved);
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
        <span>{selectedSym}</span>
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
              {loadingWallet ? (
                <p className="mt-2 text-xs text-muted-foreground">Loading wallet tokens…</p>
              ) : isConnected ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing tokens in your wallet on IOPN
                </p>
              ) : null}
            </div>

            <ul className="max-h-72 overflow-y-auto p-2">
              {sortedResults.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {isConnected
                    ? "No tokens found. Paste a contract address to search."
                    : "Connect wallet to see your tokens."}
                </li>
              ) : (
                sortedResults.map((token) => {
                  const bal = balances.get(token.address.toLowerCase());
                  const sym = resolveTokenSymbol(
                    token.address,
                    listSymbols.get(token.address.toLowerCase()) ?? token.symbol
                  );
                  return (
                    <li key={token.address}>
                      <button
                        type="button"
                        onClick={() => pick({ ...token, symbol: sym })}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary",
                          token.address.toLowerCase() === value.toLowerCase() && "bg-primary/10"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="font-medium">{sym}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          {isConnected ? (
                            <div className="text-sm font-semibold tabular-nums">
                              {bal?.formatted ?? "0"}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Connect wallet</div>
                          )}
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
