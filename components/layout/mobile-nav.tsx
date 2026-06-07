"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Coins,
  Send,
  Award,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/swap", icon: ArrowLeftRight, label: "Swap" },
  { href: "/stake", icon: Coins, label: "Stake" },
  { href: "/multisend", icon: Send, label: "Send" },
  { href: "/points", icon: Award, label: "Points" }
];

export function MobileNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card/95 backdrop-blur-xl lg:hidden">
      {items.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] sm:text-xs",
            pathname === href ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
      <button
        type="button"
        onClick={onMenuClick}
        className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground sm:text-xs"
        aria-label="More menu"
      >
        <Menu className="h-5 w-5" />
        Menu
      </button>
    </nav>
  );
}
