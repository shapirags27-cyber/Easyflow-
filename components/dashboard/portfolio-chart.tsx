"use client";

export function PortfolioChart() {
  const segments = [
    { label: "Staked", pct: 60, color: "hsl(216 100% 50%)" },
    { label: "Liquidity", pct: 25, color: "hsl(188 100% 50%)" },
    { label: "Available", pct: 15, color: "hsl(240 18% 30%)" }
  ];

  let offset = 0;
  const gradient = segments
    .map((s) => {
      const start = offset;
      offset += s.pct;
      return `${s.color} ${start}% ${offset}%`;
    })
    .join(", ");

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="font-semibold">Portfolio Overview</h3>
      <p className="text-sm text-muted-foreground">Asset allocation</p>
      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
        <div
          className="h-36 w-36 shrink-0 rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        />
        <div className="flex w-full flex-col gap-3">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </div>
              <span className="font-medium">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
