import { AppLayoutShell } from "@/components/layout/app-layout-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutShell>{children}</AppLayoutShell>;
}
