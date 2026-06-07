"use client";

import { useAccount } from "wagmi";
import { AppShellBar } from "@/components/layout/app-shell-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift } from "lucide-react";

export default function ReferralsPage() {
  const { address, isConnected } = useAccount();
  const refLink = address
    ? `https://easyflow.app/?ref=${address.slice(0, 10)}`
    : "Connect wallet to get your link";

  return (
    <>
      <AppShellBar title="Referrals" subtitle="Invite friends and earn bonus points." />
      <div className="mx-auto max-w-lg p-4 md:p-8">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Gift className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-xl font-semibold">Share EasyFlow</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Earn 50 XP for each friend who completes their first swap.
          </p>
          <div className="mt-6 flex gap-2">
            <Input readOnly value={refLink} className="font-mono text-xs" />
            <Button
              variant="secondary"
              disabled={!isConnected}
              onClick={() => navigator.clipboard.writeText(refLink)}
            >
              Copy
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Referrals: 0 • Earned: 0 XP</p>
        </div>
      </div>
    </>
  );
}
