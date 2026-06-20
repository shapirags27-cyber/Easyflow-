import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">Platform user management.</p>
      </div>
      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            User wallet activity and profiles will appear here. End users continue to authenticate via wallet connection only.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No wallet-based admin access — this panel is for authenticated admins only.
        </CardContent>
      </Card>
    </div>
  );
}
