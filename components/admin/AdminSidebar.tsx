"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminSession } from "@/lib/auth/types";

interface AdminSidebarProps {
  session: AdminSession;
  pendingReviewCount?: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactNode;
  badge?: string;
  minRole?: "ADMIN" | "EDITOR" | "AUTHOR";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AdminSidebar({
  session,
  pendingReviewCount = 0,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const sections: NavSection[] = [
    {
      title: "Core",
      items: [
        {
          label: "Dashboard",
          href: "/admin",
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Content",
      items: [
        {
          label: "Review Queue",
          href: "/admin/review",
          badge: pendingReviewCount > 0 ? String(pendingReviewCount) : undefined,
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
        },
        {
          label: "Games",
          href: "/admin/games",
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          ),
        },
        {
          label: "Apps & APKs",
          href: "/admin/apps",
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          label: "Tools",
          href: "/admin/tools",
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          label: "Guides & Tutorials",
          href: "/admin/guides",
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Library & Taxonomy",
      items: [
        {
          label: "Downloads & Mirr.",
          href: "/admin/downloads",
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          ),
        },
        {
          label: "Categories",
          href: "/admin/categories",
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
        },
        {
          label: "Tags",
          href: "/admin/tags",
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Discovery & System",
      items: [
        {
          label: "Global Search",
          href: "/admin/search",
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          ),
        },
        {
          label: "SEO Metadata",
          href: "/admin/seo",
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          ),
        },
        {
          label: "Analytics & Growth",
          href: "/admin/analytics",
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
        {
          label: "Users & Roles",
          href: "/admin/users",
          minRole: "ADMIN",
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
        {
          label: "Monetization & Ads",
          href: "/admin/monetization",
          minRole: "EDITOR",
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          label: "Settings & System",
          href: "/admin/settings",
          icon: (p) => (
            <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          ),
        },
      ],
    },
  ];

  const roleColors = {
    ADMIN: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    EDITOR: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    AUTHOR: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0A0E17] border-r border-white/10 select-none">
      {/* Top Brand */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        <Link
          href="/admin"
          onClick={onCloseMobile}
          className="flex items-center gap-3 overflow-hidden"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center font-mono font-bold text-primary text-base flex-shrink-0">
            M
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-white tracking-wide truncate">
                  MOHA<span className="text-primary">.LAB</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-text-tertiary">
                  CMS
                </span>
              </div>
              <span className="text-[11px] font-mono text-text-tertiary block truncate">
                Admin Control
              </span>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-text-tertiary hover:text-white hover:bg-white/5 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
        {sections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <div className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary px-3 mb-2">
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items
                .filter((item) => {
                  if (!item.minRole) return true;
                  if (session.role === "ADMIN") return true;
                  if (item.minRole === "EDITOR" && session.role === "EDITOR") return true;
                  return false;
                })
                .map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/30 shadow-sm shadow-primary/10 font-semibold"
                        : "text-text-secondary hover:text-white hover:bg-white/5 border border-transparent"
                    } ${collapsed ? "justify-center px-2" : ""}`}
                  >
                    {item.icon({
                      className: `w-4 h-4 flex-shrink-0 ${
                        isActive ? "text-primary" : "text-text-tertiary group-hover:text-white"
                      }`,
                    })}
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-text-secondary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Info & Footer Actions */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {/* User Card */}
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/5 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-white flex-shrink-0">
            {session.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-white truncate">{session.name}</span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    roleColors[session.role] || "bg-white/10 text-white"
                  }`}
                >
                  {session.role}
                </span>
              </div>
              <span className="text-[11px] font-mono text-text-tertiary block truncate">
                {session.email}
              </span>
            </div>
          )}
        </div>

        {/* View Live Site & Logout */}
        <div className={`flex items-center gap-1 ${collapsed ? "flex-col" : ""}`}>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Live Public Site"
            className="flex-1 py-1.5 px-2 rounded-lg text-text-tertiary hover:text-white hover:bg-white/5 transition-colors text-[11px] font-mono flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {!collapsed && <span>Live Site</span>}
          </Link>
          <Link
            href="/admin/logout"
            title="Log Out of Control Hub"
            className="flex-1 py-1.5 px-2 rounded-lg text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-[11px] font-mono flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Logout</span>}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block fixed top-0 bottom-0 left-0 z-30 transition-all duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed top-0 bottom-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
