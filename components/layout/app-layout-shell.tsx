"use client";

import * as React from "react";
import { AppTopHeader } from "@/components/layout/app-top-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarBrand, SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-dvh w-full bg-background">
      {/* Desktop sidebar — in document flow */}
      <aside className="hidden h-dvh w-[260px] shrink-0 flex-col border-r border-border bg-card lg:flex">
        <SidebarBrand />
        <SidebarNav />
      </aside>

      {/* Mobile drawer backdrop */}
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-50 bg-black/60 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[60] flex w-[min(300px,88vw)] flex-col border-r border-border bg-card shadow-2xl transition-transform duration-200 ease-out lg:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!menuOpen}
      >
        <SidebarBrand onClose={() => setMenuOpen(false)} />
        <SidebarNav onNavigate={() => setMenuOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <AppTopHeader onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-auto pb-[4.5rem] lg:pb-0">{children}</main>
      </div>

      <MobileNav onMenuClick={() => setMenuOpen(true)} />
    </div>
  );
}
