import { AppShellBar } from "@/components/layout/app-shell-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocsPage() {
  return (
    <>
      <AppShellBar title="Docs" subtitle="Setup, deployment, and API reference." />
      <div className="grid gap-6 p-4 md:p-8 md:grid-cols-2">
        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle>Network</CardTitle>
            <CardDescription>IOPN Testnet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>Chain ID: 984</div>
            <div>RPC: https://testnet-rpc.iopn.tech</div>
            <div>Symbol: OPN</div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle>Pages</CardTitle>
            <CardDescription>App routes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <div>/dashboard — overview</div>
            <div>/swap — AMM swaps</div>
            <div>/stake — staking</div>
            <div>/multisend — split OPN</div>
            <div>/pools — liquidity</div>
            <div>/borrow — lending (preview)</div>
            <div>/points — leaderboard</div>
            <div>/account — profile</div>
            <div>/admin — fee backend</div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 md:col-span-2">
          <CardHeader>
            <CardTitle>Commands</CardTitle>
            <CardDescription>Development</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-sm text-muted-foreground">
            <div>npm i</div>
            <div>npm run dev</div>
            <div>npm run contracts:compile</div>
            <div>npm run contracts:deploy:iopn</div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 md:col-span-2">
          <CardHeader>
            <CardTitle>Railway Deploy</CardTitle>
            <CardDescription>Frontend + PostgreSQL on Railway</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>1. Add PostgreSQL + GitHub repo as two Railway services</div>
            <div>2. Set DATABASE_URL = {"${{Postgres.DATABASE_URL}}"}</div>
            <div>3. Deploy runs: prisma migrate + next build</div>
            <div>See RAILWAY.md in repo root for full guide</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
