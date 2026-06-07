"use client";

import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PointsProgress({ points, level = "Gold" }: { points: number; level?: string }) {
  const max = 6000;
  const pct = Math.min(100, (points / max) * 100);

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Your Progress</h3>
        <Badge>{level} Level</Badge>
      </div>
      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary/30 bg-primary/5">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#grad)"
              strokeWidth="8"
              strokeDasharray={`${pct * 2.64} 264`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(262 83% 58%)" />
                <stop offset="100%" stopColor="hsl(199 89% 48%)" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-lg font-bold">{Math.round(pct)}%</span>
        </div>
        <div className="w-full text-center text-sm text-muted-foreground">
          {points.toLocaleString()} / {max.toLocaleString()} XP
        </div>
        <ProgressBar value={points} max={max} className="w-full" />
        <Button variant="secondary" className="mt-4 w-full" asChild>
          <Link href="/points">View Rewards</Link>
        </Button>
      </div>
    </div>
  );
}
