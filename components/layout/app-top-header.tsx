"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function AppTopHeader({ onMenuClick }: { onMenuClick?: () => void }) {

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg border border-border",
            "bg-secondary text-foreground lg:hidden"
          )}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          href="/docs"
          className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
        >
          Docs
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <WalletConnectButton />
      </div>
    </header>
  );
}
