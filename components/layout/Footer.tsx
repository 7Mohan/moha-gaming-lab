import Link from "next/link";
import { navItems } from "@/lib/nav";

const footerSections = [
  {
    title: "Platform",
    links: navItems.slice(0, 4),
  },
  {
    title: "Resources",
    links: [
      { label: "Downloads",  href: "/downloads" },
      { label: "Guides",     href: "/guides" },
      { label: "Search",     href: "/search" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About",   href: "/about" },
      { label: "Privacy", href: "/privacy" },
      { label: "Contact", href: "/contact" },
      { label: "Admin Portal", href: "/admin/login" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="border-t border-border-subtle bg-bg-surface mt-auto"
      role="contentinfo"
    >
      <div className="container-content py-12">
        {/* Top: Brand + Links */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
              aria-label="Moha Gaming Lab home"
            >
              <div className="w-6 h-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M2 7L5.5 3.5L7 5L9 2.5L12 7L9 11.5L7 9L5.5 10.5L2 7Z"
                    stroke="#00E5A0"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-sm font-bold text-text-primary">Moha Gaming Lab</span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed max-w-xs">
              Android gaming optimization tools, performance diagnostics, and technical guides.
            </p>
          </div>

          {/* Nav sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="label-mono mb-4">{section.title}</h3>
              <ul className="space-y-2.5" role="list">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="divider mb-6" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-text-muted font-mono">
            © {new Date().getFullYear()} Moha Gaming Lab. All rights reserved.
          </p>
          <p className="text-xs text-text-muted">
            Built for Android gamers worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
