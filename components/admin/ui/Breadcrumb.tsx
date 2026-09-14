import * as React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary mb-4" aria-label="Breadcrumb">
      <Link href="/admin" className="hover:text-white transition-colors">
        Admin
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <span className="text-white/20">/</span>
            {isLast || !item.href ? (
              <span className="text-white font-medium truncate">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-white transition-colors truncate">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
