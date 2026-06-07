"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
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

type SidebarNavProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { address } = useAccount();
  const isAdmin = Boolean(address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase());
  const [groupOpen, setGroupOpen] = React.useState<Record<string, boolean>>({});

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center rounded-xl text-sm font-medium transition-all",
      collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
      active
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    );

  return (
    <>
      <nav
        className={cn(
          "flex flex-1 flex-col gap-0.5 overflow-y-auto py-2",
          collapsed ? "px-2" : "px-3"
        )}
      >
        {sidebarNav.map((item) => {
          if (item.children) {
            const childActive = item.children.some((c) => pathname === c.href);
            const isOpen = groupOpen[item.label] ?? childActive;
            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() =>
                    setGroupOpen((prev) => ({ ...prev, [item.label]: !isOpen }))
                  }
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center rounded-xl text-sm font-medium transition-all",
                    collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                    "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed ? <span className="flex-1 text-left">{item.label}</span> : null}
                  {!collapsed ? (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 opacity-70 transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  ) : null}
                </button>
                {isOpen && !collapsed ? (
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
              title={collapsed ? item.label : undefined}
              className={linkClass(active)}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed ? item.label : null}
            </Link>
          );
        })}

        {isAdmin ? (
          <Link
            href={adminNav.href}
            onClick={onNavigate}
            title={collapsed ? adminNav.label : undefined}
            className={linkClass(pathname === adminNav.href)}
          >
            <adminNav.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed ? adminNav.label : null}
          </Link>
        ) : null}
      </nav>

      {!collapsed ? <OpnPriceWidget /> : null}
    </>
  );
}

export function SidebarBrand({
  collapsed = false,
  onClose,
  onToggleCollapse
}: {
  collapsed?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className={cn("border-b border-border", collapsed ? "px-2 py-3" : "px-4 py-4")}>
      {onToggleCollapse ? (
        <div className={cn("mb-3 hidden lg:flex", collapsed ? "justify-center" : "justify-end")}>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "flex items-center gap-3",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link
          href="/"
          className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}
          onClick={onClose}
          title={collapsed ? "EasyFlow" : undefined}
        >
          <Logo size={collapsed ? 36 : 40} priority />
          {!collapsed ? (
            <span className="text-base font-semibold tracking-tight">EasyFlow</span>
          ) : null}
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
    </div>
  );
}

