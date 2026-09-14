import type { MetadataRoute } from "next";
import { SITE } from "@/lib/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/auth",
        "/auth/",
        "/search",
        "/api/",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/private/",
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
