"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="admin-root min-h-dvh bg-bg-base text-text-primary antialiased">
        {children}
      </div>
    );
  }

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 pt-[3.75rem]" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
