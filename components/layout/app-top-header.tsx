"use client";

import Link from "next/link";
import { Menu, Moon, Sun, Monitor } from "lucide-react";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export function AppTopHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const { resolved, theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  const ThemeIcon =
    theme === "system" ? Monitor : resolved === "dark" ? Sun : Moon;

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
        <button
          type="button"
          aria-label={`Theme: ${theme}. Click to change.`}
          title={`Theme: ${theme} (auto-detect when system)`}
          onClick={cycleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ThemeIcon className="h-4 w-4" />
        </button>
        <WalletConnectButton />
      </div>
    </header>
  );
}
