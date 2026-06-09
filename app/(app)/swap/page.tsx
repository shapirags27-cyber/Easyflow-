"use client";

import * as React from "react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { ArrowDownUp } from "lucide-react";
import { AppShellBar } from "@/components/layout/app-shell-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSwap } from "@/lib/hooks/useSwap";
import { getUniqueTokens } from "@/lib/tokens";

const SWAP_TOKENS = getUniqueTokens();

export default function SwapPage() {
  const { isConnected } = useAccount();
  const [amountIn, setAmountIn] = React.useState("0.1");
  const [slippageBps, setSlippageBps] = React.useState(50);
  const { tokenIn, tokenOut, setTokenInOut, quote, refreshQuote, doSwap, isPending } = useSwap();

  const amountInWei = React.useMemo(() => {
    try {
      return parseUnits(amountIn || "0", tokenIn.decimals);
    } catch {
      return 0n;
    }
  }, [amountIn, tokenIn.decimals]);

  React.useEffect(() => {
    refreshQuote(amountInWei);
  }, [amountInWei, refreshQuote]);

  const swapTokens = () => setTokenInOut(tokenOut.symbol, tokenIn.symbol);

  return (
    <>
      <AppShellBar title="Swap" subtitle="Exchange tokens via constant-product AMM." />
      <div className="mx-auto max-w-lg p-4 md:p-8">
        <div className="glass rounded-2xl p-6 glow-primary">
          <div className="grid gap-4">
            <div className="rounded-xl bg-secondary/50 p-4">
              <Label className="text-muted-foreground">From</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  className="border-0 bg-transparent text-2xl font-semibold"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                />
                <select
                  className="rounded-lg border bg-card px-3 text-sm"
                  value={tokenIn.symbol}
                  onChange={(e) => setTokenInOut(e.target.value, tokenOut.symbol)}
                >
                  {SWAP_TOKENS.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={swapTokens}
                className="rounded-full border border-primary/30 bg-primary/10 p-2 text-primary hover:bg-primary/20"
              >
                <ArrowDownUp className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-secondary/50 p-4">
              <Label className="text-muted-foreground">To (estimated)</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  className="border-0 bg-transparent text-2xl font-semibold"
                  value={quote.formattedOut}
                  readOnly
                />
                <select
                  className="rounded-lg border bg-card px-3 text-sm"
                  value={tokenOut.symbol}
                  onChange={(e) => setTokenInOut(tokenIn.symbol, e.target.value)}
                >
                  {SWAP_TOKENS.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-white/5 p-3">
                <div className="text-muted-foreground">Price impact</div>
                <div className="font-medium">~0.12%</div>
              </div>
              <div className="rounded-lg border border-white/5 p-3">
                <div className="text-muted-foreground">Slippage (bps)</div>
                <Input
                  className="mt-1 h-8"
                  value={String(slippageBps)}
                  onChange={(e) => setSlippageBps(Number(e.target.value || 0))}
                />
              </div>
            </div>
            <div
              className={`text-xs ${quote.quoteError ? "text-destructive" : "text-muted-foreground"}`}
            >
              {quote.priceText}
            </div>

            <Button
              size="lg"
              className="w-full glow-primary"
              disabled={!isConnected || isPending || amountInWei === 0n || !quote.canSwap}
              onClick={() => doSwap(amountInWei, slippageBps)}
            >
              {isConnected ? (isPending ? "Swapping…" : "Swap") : "Connect Wallet"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">+15 points per swap</p>
          </div>
        </div>
      </div>
    </>
  );
}
