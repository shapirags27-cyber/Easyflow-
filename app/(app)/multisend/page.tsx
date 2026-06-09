"use client";

import * as React from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { Plus, Trash2, Upload } from "lucide-react";
import { AppShellBar } from "@/components/layout/app-shell-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMultiSend } from "@/lib/hooks/useMultiSend";
import { parseMultiSendCsv } from "@/lib/multisend-csv";

type Row = { to: string; value: string; bps?: string };

export default function MultiSendPage() {
  const { isConnected } = useAccount();
  const [mode, setMode] = React.useState<"fixed" | "percent">("fixed");
  const [total, setTotal] = React.useState("0.1");
  const [splitType, setSplitType] = React.useState<"equal" | "custom">("equal");
  const [rows, setRows] = React.useState<Row[]>([
    { to: "", value: "0.05" },
    { to: "", value: "0.05" }
  ]);

  const { sendFixed, sendPercent, isPending } = useMultiSend();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = React.useState<string | null>(null);
  const [importError, setImportError] = React.useState<string | null>(null);

  const totalWei = React.useMemo(() => {
    try {
      return parseEther(total || "0");
    } catch {
      return 0n;
    }
  }, [total]);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  const applyEqualSplit = () => {
    const n = rows.length;
    if (n === 0) return;
    const each = (Number(total) / n).toFixed(6);
    setRows(rows.map((r) => ({ ...r, value: each, bps: String(Math.floor(10000 / n)) })));
  };

  React.useEffect(() => {
    if (splitType === "equal" && mode === "fixed") applyEqualSplit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitType, total, rows.length]);

  const handleFileUpload = async (file: File) => {
    setImportMessage(null);
    setImportError(null);

    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".txt") && !name.endsWith(".tsv")) {
      setImportError("Please upload a .csv or .txt file (export from Excel or Google Sheets).");
      return;
    }

    const text = await file.text();
    const { rows: parsed, errors, hasAmounts, hasBps } = parseMultiSendCsv(text);

    if (parsed.length === 0) {
      setImportError(errors[0] ?? "No valid addresses found in file.");
      return;
    }

    setRows(parsed);

    if (hasBps) {
      setMode("percent");
      setSplitType("custom");
    } else if (hasAmounts) {
      setMode("fixed");
      setSplitType("custom");
    } else {
      setSplitType("equal");
    }

    const summary = `Imported ${parsed.length} wallet${parsed.length === 1 ? "" : "s"}.`;
    const warn = errors.length > 0 ? ` Skipped ${errors.length} invalid row(s).` : "";
    setImportMessage(summary + warn);
    if (errors.length > 0) setImportError(errors.slice(0, 3).join(" "));
  };

  const canSubmit =
    isConnected &&
    rows.length > 0 &&
    rows.every((r) => r.to.length > 0) &&
    (mode === "fixed"
      ? rows.every((r) => Number(r.value) > 0)
      : rows.every((r) => Number(r.bps || "0") > 0)) &&
    (mode === "fixed" ? true : totalWei > 0n);

  return (
    <>
      <AppShellBar title="Multi-Send" subtitle="Split native OPN to multiple wallets in one transaction." />
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        <div className="glass rounded-2xl p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Total Amount (OPN)</Label>
              <Input className="mt-2" value={total} onChange={(e) => setTotal(e.target.value)} />
            </div>
            <div>
              <Label>Split Type</Label>
              <select
                className="mt-2 h-10 w-full rounded-md border bg-card px-3 text-sm"
                value={splitType}
                onChange={(e) => setSplitType(e.target.value as "equal" | "custom")}
              >
                <option value="equal">Equal</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <Label>Mode</Label>
              <select
                className="mt-2 h-10 w-full rounded-md border bg-card px-3 text-sm"
                value={mode}
                onChange={(e) => setMode(e.target.value as "fixed" | "percent")}
              >
                <option value="fixed">Fixed amounts</option>
                <option value="percent">Percent (bps)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="flex gap-2 rounded-lg border border-white/5 bg-secondary/20 p-3">
                <div className="flex-1">
                  <Input
                    placeholder="0x recipient"
                    value={r.to}
                    onChange={(e) => updateRow(i, { to: e.target.value })}
                  />
                </div>
                <Input
                  className="w-28"
                  placeholder={mode === "fixed" ? "OPN" : "bps"}
                  value={mode === "fixed" ? r.value : r.bps || ""}
                  onChange={(e) =>
                    updateRow(i, mode === "fixed" ? { value: e.target.value } : { bps: e.target.value })
                  }
                  disabled={splitType === "equal" && mode === "fixed"}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setRows((p) => [...p, { to: "", value: "0" }])}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRows((p) => (p.length > 1 ? p.slice(0, -1) : p))}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Remove
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-1 h-4 w-4" /> Upload CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.tsv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileUpload(file);
                e.target.value = "";
              }}
            />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            CSV format: one wallet per line — <code className="text-foreground">0xAddress</code> or{" "}
            <code className="text-foreground">0xAddress,0.5</code>. Export from Excel or Google Sheets as CSV.
          </p>
          {importMessage ? (
            <p className="mt-1 text-xs text-emerald-400">{importMessage}</p>
          ) : null}
          {importError ? (
            <p className="mt-1 text-xs text-destructive">{importError}</p>
          ) : null}

          <Button
            className="mt-6 w-full glow-primary"
            size="lg"
            disabled={!canSubmit || isPending}
            onClick={() => {
              if (mode === "fixed") {
                const tos = rows.map((x) => x.to as `0x${string}`);
                const amounts = rows.map((x) => parseEther(x.value || "0"));
                const sum = amounts.reduce((a, b) => a + b, 0n);
                sendFixed(tos, amounts, sum);
              } else {
                const tos = rows.map((x) => x.to as `0x${string}`);
                const bps = rows.map((x) => BigInt(Math.floor(Number(x.bps || "0"))));
                sendPercent(tos, bps, totalWei);
              }
            }}
          >
            {isConnected ? (isPending ? "Sending…" : "Execute Multi-Send") : "Connect Wallet"}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">+10 points per multi-send</p>
        </div>
      </div>
    </>
  );
}
