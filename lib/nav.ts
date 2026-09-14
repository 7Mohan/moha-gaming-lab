export interface NavItem {
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { label: "Home",      href: "/" },
  { label: "Games",     href: "/games" },
  { label: "Apps",      href: "/apps" },
  { label: "Tools",     href: "/tools" },
  { label: "Guides",    href: "/guides" },
  { label: "Downloads", href: "/downloads" },
  { label: "About",     href: "/about" },
];
