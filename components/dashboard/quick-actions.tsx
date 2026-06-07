import Link from "next/link";
import { ArrowLeftRight, Coins, Droplets, Send, Wallet, Sparkles } from "lucide-react";

const actions = [
  { href: "/swap", label: "Swap", icon: ArrowLeftRight, bg: "bg-blue-500" },
  { href: "/stake", label: "Stake", icon: Coins, bg: "bg-emerald-500" },
  { href: "/multisend", label: "Multi-Send", icon: Send, bg: "bg-violet-500" },
  { href: "/pools", label: "Add Liquidity", icon: Droplets, bg: "bg-cyan-500" },
  { href: "/borrow", label: "Borrow", icon: Wallet, bg: "bg-orange-500" },
  { href: "/points", label: "Claim Rewards", icon: Sparkles, bg: "bg-lime-500" }
];

export function QuickActions() {
  return (
    <div>
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {actions.map(({ href, label, icon: Icon, bg }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-card/40 p-4 transition-all hover:border-white/10 hover:bg-card/60"
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${bg} text-white shadow-lg transition-transform group-hover:scale-105`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-center text-xs font-medium text-muted-foreground group-hover:text-foreground">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
