"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Coins,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Star,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/admin-roles";
import type { AdminRole } from "@prisma/client";
import { useAdminCsrf } from "@/lib/hooks/useAdminCsrf";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/points", label: "Points", icon: Star },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/tokens", label: "Tokens", icon: Coins },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

type AdminShellProps = {
  admin: { email: string; role: AdminRole };
  children: React.ReactNode;
};

export function AdminShell({ admin, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminFetch } = useAdminCsrf();

  async function logout() {
    await adminFetch("/api/admin/auth/session", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-semibold">EasyFlow Admin</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{admin.email}</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {roleLabel(admin.role)}
            </span>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              <LogOut className="mr-1 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 p-4 md:grid-cols-[220px_1fr] md:p-6">
        <nav className="glass flex flex-row gap-1 overflow-x-auto rounded-2xl p-2 md:flex-col md:overflow-visible">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/dashboard"
            className="mt-auto flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Shield className="h-4 w-4" />
            Back to app
          </Link>
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
}
