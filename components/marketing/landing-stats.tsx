"use client";

import * as React from "react";

const defaults = [
  { label: "TVL", value: "$2.45M" },
  { label: "Total Staked", value: "1.28M OPN" },
  { label: "Total Swapped", value: "6.73M OPN" },
  { label: "Points Distributed", value: "1.94M" }
];

export function LandingStats() {
  const [stats, setStats] = React.useState(defaults);

  React.useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats([
          { label: "TVL", value: data.tvl ?? defaults[0].value },
          { label: "Total Staked", value: data.totalStaked ?? defaults[1].value },
          { label: "Total Swapped", value: data.totalSwapped ?? defaults[2].value },
          { label: "Points Distributed", value: data.pointsDistributed ?? defaults[3].value }
        ]);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="border-y border-border bg-card/30">
      <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-bold md:text-3xl">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
