import { requireSession } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAllGuides } from "@/lib/services/guide-service";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, allGuides] = await Promise.all([
    requireSession(),
    getAllGuides(),
  ]);

  const pendingReviewCount = allGuides.filter((g) => g.status === "review").length;

  return (
    <AdminShell session={session} pendingReviewCount={pendingReviewCount}>
      {children}
    </AdminShell>
  );
}
