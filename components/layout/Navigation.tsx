"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { navItems } from "@/lib/nav";


export function Navigation({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className={cn("flex items-center gap-1", className)}
    >
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative px-3 py-1.5 text-sm font-medium rounded-md",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
              isActive
                ? "text-text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
            {isActive && (
              <span
                className="absolute bottom-0 left-3 right-3 h-px bg-accent rounded-full"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
