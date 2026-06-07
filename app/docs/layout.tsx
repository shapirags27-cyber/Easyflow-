import { AppLayoutShell } from "@/components/layout/app-layout-shell";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutShell>{children}</AppLayoutShell>;
}
