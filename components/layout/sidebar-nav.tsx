"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import * as React from "react";
import { adminNav, sidebarNav } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { ADMIN_ADDRESS } from "@/lib/admin";
import { useAccount } from "wagmi";
import { Logo } from "@/components/layout/logo";
import { OpnPriceWidget } from "@/components/layout/opn-price-widget";

function isActive(pathname: string, href?: string) {
  if (!href) return false;
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { address } = useAccount();
  const isAdmin = Boolean(address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase());
  const [swapOpen, setSwapOpen] = React.useState(
    pathname === "/swap" || pathname === "/pools"
  );

  React.useEffect(() => {
    if (pathname === "/swap" || pathname === "/pools") setSwapOpen(true);
  }, [pathname]);

  return (
    <>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
        {sidebarNav.map((item) => {
          if (item.children) {
            const childActive = item.children.some((c) => pathname === c.href);
            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => setSwapOpen((o) => !o)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    childActive
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 opacity-70 transition-transform",
                      swapOpen && "rotate-180"
                    )}
                  />
                </button>
                {swapOpen ? (
                  <div className="ml-9 mt-0.5 space-y-0.5 border-l border-border pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "block rounded-lg px-3 py-2 text-sm transition-colors",
                          pathname === child.href
                            ? "font-medium text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }

          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin ? (
          <Link
            href={adminNav.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              pathname === adminNav.href
                ? "bg-violet-600 text-white"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <adminNav.icon className="h-[18px] w-[18px]" />
            {adminNav.label}
          </Link>
        ) : null}
      </nav>
      <OpnPriceWidget />
    </>
  );
}

export function SidebarBrand({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-5">
      <Link href="/" className="flex items-center gap-3" onClick={onClose}>
        <Logo size={40} priority />
        <span className="text-base font-semibold tracking-tight">EasyFlow</span>
      </Link>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
