"use client";

/** Sidebar footer — OPN price + mini sparkline (mock data until indexer). */
export function OpnPriceWidget() {
  const price = 0.8421;
  const change = 4.21;
  const bars = [40, 55, 45, 60, 50, 70, 65, 80, 75, 90];

  return (
    <div className="mx-3 mb-4 rounded-xl border border-white/5 bg-secondary/40 p-3">
      <div className="text-xs text-muted-foreground">OPN Price</div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="text-lg font-semibold">${price.toFixed(4)}</span>
        <span className="text-xs font-medium text-emerald-400">+{change}%</span>
      </div>
      <div className="mt-3 flex h-8 items-end gap-0.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-emerald-500/60"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}
