"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, setTheme } = useTheme();
  const ThemeIcon = resolved === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
      onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        className
      )}
    >
      <ThemeIcon className="h-4 w-4" />
    </button>
  );
}
