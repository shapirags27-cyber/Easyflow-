import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Platform metrics and activity.</p>
      </div>
      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle>Platform analytics</CardTitle>
          <CardDescription>TVL, swap volume, staking, and points distribution.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Analytics dashboards will pull from on-chain data and transaction logs.
        </CardContent>
      </Card>
    </div>
  );
}
