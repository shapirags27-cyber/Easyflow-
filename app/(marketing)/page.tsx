import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ArrowRight, Sparkles } from "lucide-react";
import { LandingStats } from "@/components/marketing/landing-stats";

const features = [
  { title: "Swap", desc: "AMM swaps with live quotes and slippage control." },
  { title: "Stake", desc: "Stake tokens, track rewards, earn on-chain points." },
  { title: "Multi-Send", desc: "Split native OPN to many wallets in one transaction." },
  { title: "Pools", desc: "Add liquidity and earn fees from trading volume." }
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="hero-grid absolute inset-0 opacity-40" />
      <section className="container relative py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            IOPN Testnet • EasyFlow
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            One Dashboard For{" "}
            <span className="gradient-text">Everything On IOPN Chain</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Swap, stake, multi-send, provide liquidity, borrow, and climb the points leaderboard — all
            in one modular DeFi hub.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button size="lg" className="glow-primary" asChild>
              <Link href="/dashboard">
                Launch App <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/docs">View Docs</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative flex h-40 w-40 items-center justify-center md:h-52 md:w-52">
              <Logo size={208} priority className="h-40 w-40 md:h-52 md:w-52" />
            </div>
          </div>
        </div>
      </section>

      <LandingStats />

      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-xl p-6 transition-all hover:border-primary/30">
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
