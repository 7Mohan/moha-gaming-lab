"use client";

import * as React from "react";
import Image from "next/image";
import {
  listUsersAction,
  updateUserRoleAction,
  assignUserRoleByEmailAction,
  type ManagedUser,
} from "@/app/admin/(dashboard)/users/actions";

type UserRole = "ADMIN" | "EDITOR" | "AUTHOR" | "USER";

interface UserManagementClientProps {
  initialUsers?: ManagedUser[];
}

export function UserManagementClient({ initialUsers = [] }: UserManagementClientProps) {
  const [users, setUsers] = React.useState<ManagedUser[]>(initialUsers);
  const [loading, setLoading] = React.useState(initialUsers.length === 0);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");

  // Quick assign form state
  const [quickEmail, setQuickEmail] = React.useState("");
  const [quickRole, setQuickRole] = React.useState<UserRole>("ADMIN");
  const [quickSubmitting, setQuickSubmitting] = React.useState(false);

  // Notifications
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Per-user updating indicator
  const [updatingUserId, setUpdatingUserId] = React.useState<string | null>(null);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    const res = await listUsersAction();
    if (res.success && res.data) {
      setUsers(res.data);
    } else {
      setErrorMsg(res.error || "Failed to load users");
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Quick Assign
  async function handleQuickAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!quickEmail.trim()) return;

    setQuickSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await assignUserRoleByEmailAction(quickEmail, quickRole);
    if (res.success) {
      setSuccessMsg(`Successfully set role for ${quickEmail} to ${quickRole}!`);
      setQuickEmail("");
      await fetchUsers();
    } else {
      setErrorMsg(res.error || "Failed to assign role.");
    }
    setQuickSubmitting(false);
  }

  // Handle Inline Role Change
  async function handleRoleChange(user: ManagedUser, newRole: "ADMIN" | "EDITOR" | "AUTHOR" | "USER") {
    if (user.role === newRole) return;
    if (user.isSuperAdmin) {
      setErrorMsg("Cannot modify the role of the primary SuperAdmin.");
      return;
    }

    setUpdatingUserId(user.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateUserRoleAction(user.id, newRole);
    if (res.success) {
      setSuccessMsg(`Updated ${user.email} to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
    } else {
      setErrorMsg(res.error || "Failed to update role");
    }
    setUpdatingUserId(null);
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (roleFilter === "ALL") return true;
    if (roleFilter === "ADMINS") return u.role === "ADMIN";
    if (roleFilter === "STAFF") return u.role === "EDITOR" || u.role === "AUTHOR";
    if (roleFilter === "USERS") return u.role === "USER";
    return true;
  });

  const roleStyles = {
    ADMIN: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    EDITOR: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    AUTHOR: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    USER: "bg-white/10 text-text-secondary border-border-default",
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Users & Role Management
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-mono">
            Control hub for managing administrator permissions and system access.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-medium bg-bg-elevated hover:bg-bg-overlay border border-border-default hover:border-accent/40 text-text-primary transition-all cursor-pointer disabled:opacity-50"
        >
          <svg
            className={`w-3.5 h-3.5 text-accent ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Refresh Users</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-mono px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-rose-200 text-xs font-mono px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Promote Card */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border-default shadow-lg shadow-black/5 dark:shadow-black/60">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">
              Assign Admin or Staff Role by Email
            </h2>
            <p className="text-[11px] text-text-secondary font-mono">
              Quickly promote any registered user to an Admin, Editor, or Author role.
            </p>
          </div>
        </div>

        <form onSubmit={handleQuickAssign} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-6">
            <label className="block text-[11px] font-mono text-text-secondary uppercase tracking-wider mb-1">
              User Email Address
            </label>
            <input
              type="email"
              required
              value={quickEmail}
              onChange={(e) => setQuickEmail(e.target.value)}
              placeholder="e.g. user@gmail.com"
              className="w-full px-3.5 py-2 rounded-xl bg-bg-elevated border border-border-default text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-mono text-text-secondary uppercase tracking-wider mb-1">
              Role
            </label>
            <select
              value={quickRole}
              onChange={(e) => setQuickRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-default text-text-primary text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors cursor-pointer"
            >
              <option value="ADMIN">ADMIN (Full Access)</option>
              <option value="EDITOR">EDITOR (Content Manager)</option>
              <option value="AUTHOR">AUTHOR (Guide Writer)</option>
              <option value="USER">USER (Regular Member)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={quickSubmitting || !quickEmail.trim()}
              className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs font-mono transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-400/20"
            >
              {quickSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Apply Role</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-bg-elevated border border-border-default text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["ALL", "ADMINS", "STAFF", "USERS"].map((filter) => (
            <button
              key={filter}
              onClick={() => setRoleFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer whitespace-nowrap ${
                roleFilter === filter
                  ? "bg-accent/20 border border-accent/40 text-accent font-bold shadow-sm"
                  : "bg-bg-elevated hover:bg-bg-overlay text-text-secondary hover:text-text-primary border border-border-subtle"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-bg-surface border border-border-default shadow-lg shadow-black/5 dark:shadow-black/70 overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono text-text-secondary">Loading registered accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-text-primary mb-1">No users found</p>
            <p className="text-xs text-text-muted font-mono">
              {search ? `No accounts match "${search}"` : "No registered users in this category."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-elevated/60 border-b border-border-subtle text-[11px] font-mono uppercase text-text-tertiary">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4 hidden md:table-cell">Sign-In Method</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Joined</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* User Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover border border-border-default flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-accent/15 text-accent font-bold flex items-center justify-center flex-shrink-0 text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary truncate">
                              {user.name}
                            </span>
                            {user.isSuperAdmin && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                <span>★</span> SuperAdmin
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-text-muted truncate block">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Auth Method */}
                    <td className="py-3 px-4 hidden md:table-cell font-mono text-[11px] text-text-secondary capitalize">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-bg-elevated border border-border-subtle">
                        {user.provider === "google" ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            Google OAuth
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Email / Password
                          </>
                        )}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3 px-4 hidden lg:table-cell font-mono text-[11px] text-text-muted">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>

                    {/* Current Role Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border tracking-wider ${
                          roleStyles[user.role]
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* Role Switcher Action */}
                    <td className="py-3 px-4 text-right">
                      {user.isSuperAdmin ? (
                        <span className="text-[11px] font-mono text-text-tertiary italic">
                          Protected Account
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          {updatingUserId === user.id ? (
                            <span className="text-[11px] font-mono text-accent flex items-center gap-1.5">
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Saving...
                            </span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                              className="px-2.5 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-overlay border border-border-default text-text-primary text-xs font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors cursor-pointer"
                            >
                              <option value="ADMIN">Make ADMIN</option>
                              <option value="EDITOR">Make EDITOR</option>
                              <option value="AUTHOR">Make AUTHOR</option>
                              <option value="USER">Set as USER</option>
                            </select>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
