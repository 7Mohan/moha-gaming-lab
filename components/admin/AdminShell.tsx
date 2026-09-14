"use client";

import * as React from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import type { AdminSession } from "@/lib/auth/types";

interface AdminShellProps {
  session: AdminSession;
  pendingReviewCount?: number;
  children: React.ReactNode;
}

export function AdminShell({ session, pendingReviewCount = 0, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#07090E] text-text-primary flex">
      {/* Sidebar Navigation */}
      <AdminSidebar
        session={session}
        pendingReviewCount={pendingReviewCount}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Column */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          collapsed ? "md:pl-16" : "md:pl-64"
        }`}
      >
        {/* Top Header */}
        <AdminHeader
          session={session}
          collapsed={collapsed}
          onOpenMobile={() => setMobileOpen(true)}
        />

        {/* Content Container */}
        <main className="flex-1 pt-16 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
