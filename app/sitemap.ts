import type { MetadataRoute } from "next";

import { site } from "@/lib/content";

/**
 * Site haritası — https://www.onurrhocam.com.tr/sitemap.xml
 *
 * Google Search Console'a bu adres verilir. Yalnızca herkese açık sayfalar
 * listelenir; `/takip` altındaki panel arama sonuçlarına girmemeli (kendi
 * layout'unda `robots: { index: false }` var, burada da hiç yer almıyor).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${site.url}/kart`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
