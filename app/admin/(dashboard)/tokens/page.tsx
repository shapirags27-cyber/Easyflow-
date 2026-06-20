"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCsrf } from "@/lib/hooks/useAdminCsrf";

type TokenRow = {
  symbol: string;
  name: string;
  address: string;
};

function shortAddr(addr: string) {
  if (addr.startsWith("0xEeee")) return "Native OPN";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function AdminTokensPage() {
  const { adminGet } = useAdminCsrf();
  const [tokens, setTokens] = React.useState<TokenRow[]>([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void adminGet("/api/admin/tokens")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setTokens(json.tokens ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load tokens"))
      .finally(() => setLoading(false));
  }, [adminGet]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tokens</h1>
        <p className="text-sm text-muted-foreground">
          Supported tokens and AMM pool listings loaded from the on-chain graph.
        </p>
      </div>

      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle>Token registry</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${tokens.length} token(s) available for swap and liquidity.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : tokens.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">No tokens found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Symbol</th>
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 font-medium">Address</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <tr key={token.address} className="border-b border-white/5">
                      <td className="py-2 pr-4 font-semibold">{token.symbol}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{token.name}</td>
                      <td className="py-2 font-mono text-xs">{shortAddr(token.address)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
