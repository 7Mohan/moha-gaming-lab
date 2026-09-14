import * as React from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/guards";
import { listUsersAction } from "./actions";
import { UserManagementClient } from "@/components/admin/users/UserManagementClient";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Users & Roles | Admin CMS Control Hub",
  description: "Manage system administrators and user roles across Moha Gaming Lab.",
};

export default async function AdminUsersPage() {
  await requireAdmin();
  const res = await listUsersAction();
  const initialUsers = res.success && res.data ? res.data : [];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Control Hub", href: "/admin" },
          { label: "Users & Roles", href: "/admin/users" },
        ]}
      />

      <UserManagementClient initialUsers={initialUsers} />
    </div>
  );
}
