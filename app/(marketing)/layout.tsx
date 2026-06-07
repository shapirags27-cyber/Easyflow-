import { MarketingHeader } from "@/components/layout/marketing-header";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <MarketingHeader />
      <main>{children}</main>
    </div>
  );
}
