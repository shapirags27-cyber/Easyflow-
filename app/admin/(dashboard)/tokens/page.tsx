import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminTokensPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tokens</h1>
        <p className="text-sm text-muted-foreground">Token registry and listings.</p>
      </div>
      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle>Token management</CardTitle>
          <CardDescription>Configure supported tokens and AMM listings.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Token admin tools will be added in a future release.
        </CardContent>
      </Card>
    </div>
  );
}
