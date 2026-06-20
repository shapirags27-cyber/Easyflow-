import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield, Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/layout/logo";
import { getAdminSession } from "@/lib/server/admin/session";

export default async function AdminLandingPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(216_100%_50%/0.15),transparent_55%)]" />

      <header className="border-b border-border/60 bg-card/50 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-semibold">EasyFlow</span>
          </Link>
          <Button asChild>
            <Link href="/admin/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex flex-1 w-full max-w-5xl flex-col justify-center px-4 py-16 md:px-6">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Admin Portal</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Secure platform administration for EasyFlow. Email, password, and two-factor authentication
            required — separate from user wallet login.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="glow-primary">
              <Link href="/admin/login">Sign in to admin</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">Back to app</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <Card className="glass border-white/10">
            <CardHeader>
              <Lock className="mb-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Secure access</CardTitle>
              <CardDescription>Password hashing, TOTP 2FA, and session-based auth.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass border-white/10">
            <CardHeader>
              <Users className="mb-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Role-based</CardTitle>
              <CardDescription>Super Admin, Admin, and Moderator permissions.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass border-white/10">
            <CardHeader>
              <Shield className="mb-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Audit trail</CardTitle>
              <CardDescription>All admin actions and login events are logged.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
