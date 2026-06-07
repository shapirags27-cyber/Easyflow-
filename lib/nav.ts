import {
  ArrowLeftRight,
  Award,
  BookOpen,
  Coins,
  Droplets,
  Gift,
  HandCoins,
  LayoutDashboard,
  Send,
  Shield,
  User
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href?: string;
  label: string;
  icon: LucideIcon;
  children?: { href: string; label: string }[];
};

export const sidebarNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/swap", label: "Swap", icon: ArrowLeftRight },
  { href: "/stake", label: "Stake", icon: Coins },
  { href: "/multisend", label: "MultiSend", icon: Send },
  { href: "/pools", label: "Pools", icon: Droplets },
  { href: "/borrow", label: "Borrow / Lend", icon: HandCoins },
  { href: "/points", label: "Points & Rewards", icon: Award },
  { href: "/referrals", label: "Referrals", icon: Gift },
  { href: "/account", label: "Profile", icon: User },
  { href: "/docs", label: "Docs", icon: BookOpen }
];

export const adminNav = { href: "/admin", label: "Admin", icon: Shield };

export const marketingNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/swap", label: "Swap" },
  { href: "/stake", label: "Stake" },
  { href: "/multisend", label: "Multi-Send" },
  { href: "/pools", label: "Pools" },
  { href: "/borrow", label: "Borrow" },
  { href: "/points", label: "Points" },
  { href: "/docs", label: "Docs" }
] as const;
