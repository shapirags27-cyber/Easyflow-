import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
  className
}: {
  title: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  trend?: "up" | "down";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/5 bg-card/60 p-5 backdrop-blur-sm transition-all hover:border-white/10",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm text-muted-foreground">{title}</div>
        {Icon ? (
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-primary/30 blur-md" />
            <div className="relative rounded-lg bg-primary/15 p-2 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {sub ? (
        <div
          className={cn(
            "mt-1 text-xs",
            trend === "up" && "text-emerald-400",
            trend === "down" && "text-red-400",
            !trend && "text-muted-foreground"
          )}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}
