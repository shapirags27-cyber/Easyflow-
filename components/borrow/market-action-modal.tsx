"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MarketActionModalProps = {
  open: boolean;
  mode: "supply" | "borrow";
  asset: string;
  apy: string;
  balance: string;
  onClose: () => void;
  onSubmit: (amount: string) => void;
};

export function MarketActionModal({
  open,
  mode,
  asset,
  apy,
  balance,
  onClose,
  onSubmit
}: MarketActionModalProps) {
  const [amount, setAmount] = React.useState("");

  React.useEffect(() => {
    if (open) setAmount("");
  }, [open, asset, mode]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const title = mode === "supply" ? `Supply ${asset}` : `Borrow ${asset}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <button type="button" aria-label="Close" className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "supply" ? "Supply APY" : "Borrow APY"}: {apy}
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <Label>Amount</Label>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setAmount(balance)}
              >
                Balance: {balance} · Max
              </button>
            </div>
            <Input
              className="mt-2"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
            />
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              onSubmit(amount);
              onClose();
            }}
          >
            {mode === "supply" ? "Supply" : "Borrow"}
          </Button>
        </div>
      </div>
    </div>
  );
}
