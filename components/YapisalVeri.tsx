import { site } from "@/lib/content";

/**
 * Google ve yapay zekâ araçları için yapısal veri (JSON-LD, schema.org).
 *
 * Sayfadaki metin "Onur Hocam"ın kim olduğunu insana anlatır; bu blok aynı şeyi
 * makineye anlatır: kişi, mesleği, nerede olduğu, hangi sosyal hesabın ona ait
 * olduğu. "Onur Hocam" adını taşıyan başka siteler olduğu için `alternateName`
 * ve `sameAs` önemli — Google hangi hesabın bu siteye ait olduğunu böyle eşler.
 *
 * `ProfessionalService` yerel aramada (Konya + eğitim koçu) işe yarar; adres ve
 * koordinat `lib/content.ts`'teki tek kaynaktan gelir.
 *
 * XSS notu: içerik sabit, kullanıcıdan gelmiyor; yine de Next rehberindeki gibi
 * `<` karakteri kaçırılıyor.
 */
export function YapisalVeri() {
  const kisiId = `${site.url}/#onur-akbag`;
  const isletmeId = `${site.url}/#isletme`;

  const veri = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": kisiId,
        name: site.name,
        alternateName: [site.markaAdi, site.handle],
        jobTitle: site.role,
        description: `${site.motto}. ${site.tagline}`,
        url: site.url,
        image: `${site.url}/oaprofile.jpg`,
        email: `mailto:${site.email}`,
        telephone: site.phone,
        sameAs: [site.socials.instagram],
        worksFor: { "@id": isletmeId },
        address: {
          "@type": "PostalAddress",
          streetAddress: site.map.address,
          addressLocality: site.map.city,
          addressCountry: "TR",
        },
      },
      {
        "@type": "ProfessionalService",
        "@id": isletmeId,
        name: `${site.markaAdi} — ${site.role}`,
        alternateName: site.name,
        description: `${site.name} ile birebir YKS ve LGS eğitim koçluğu. ${site.tagline}`,
        url: site.url,
        image: `${site.url}/oaprofile.jpg`,
        logo: `${site.url}/icon.png`,
        telephone: site.phone,
        email: `mailto:${site.email}`,
        founder: { "@id": kisiId },
        areaServed: ["Konya", "Türkiye"],
        serviceType: ["YKS koçluğu", "LGS koçluğu", "Eğitim koçluğu", "Birebir öğrenci takibi"],
        address: {
          "@type": "PostalAddress",
          streetAddress: site.map.address,
          addressLocality: site.map.city,
          addressCountry: "TR",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: site.map.lat,
          longitude: site.map.lng,
        },
        sameAs: [site.socials.instagram],
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#site`,
        url: site.url,
        name: `${site.markaAdi} — ${site.name}`,
        inLanguage: "tr-TR",
        publisher: { "@id": kisiId },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(veri).replace(/</g, "\\u003c") }}
    />
  );
}
