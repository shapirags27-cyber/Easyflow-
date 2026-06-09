"use client";

import * as React from "react";
import { ChevronDown, Search, X } from "lucide-react";
import type { Address } from "viem";
import { searchSwapTokens } from "@/lib/token-search";
import type { Token } from "@/lib/tokens";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TokenSelectProps = {
  value: Address;
  onChange: (token: Token) => void;
  excludeAddress?: Address;
  className?: string;
};

export function TokenSelect({ value, onChange, excludeAddress, className }: TokenSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const results = React.useMemo(() => {
    const list = searchSwapTokens(query);
    if (!excludeAddress) return list;
    return list.filter((t) => t.address.toLowerCase() !== excludeAddress.toLowerCase());
  }, [query, excludeAddress]);

  const selected = React.useMemo(
    () => searchSwapTokens("").find((t) => t.address.toLowerCase() === value.toLowerCase()),
    [value]
  );

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
        {label}
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
            </div>

            <ul className="max-h-64 overflow-y-auto p-2">
              {results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No tokens match your search.
                </li>
              ) : (
                results.map((token) => (
                  <li key={token.address}>
                    <button
                      type="button"
                      onClick={() => pick(token)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary",
                        token.address.toLowerCase() === value.toLowerCase() && "bg-primary/10"
                      )}
                    >
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground">{token.name}</div>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {token.address.slice(0, 6)}…{token.address.slice(-4)}
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
