import type { MetadataRoute } from "next";

import { site } from "@/lib/content";

/**
 * robots.txt — https://www.onurrhocam.com.tr/robots.txt
 *
 * Portfolyo taranabilir; öğrenci/koç paneli (`/takip`) taranmaz. Panelin
 * kendi layout'unda `robots: { index: false, follow: false }` zaten var,
 * burası taramayı en baştan kesiyor.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/takip/",
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
