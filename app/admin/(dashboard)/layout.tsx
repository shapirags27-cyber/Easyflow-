import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/server/admin/session";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function ProtectedAdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AdminShell admin={{ email: session.email, role: session.role }}>
      {children}
    </AdminShell>
  );
}
