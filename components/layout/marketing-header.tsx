"use client";

import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { marketingNav } from "@/lib/nav";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={36} priority />
          <span className="text-base font-semibold tracking-tight">EasyFlow</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <WalletConnectButton />
          <Button size="sm" className="glow-primary hidden sm:inline-flex" asChild>
            <Link href="/dashboard">Launch App</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
