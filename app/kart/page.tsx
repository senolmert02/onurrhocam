import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/content";
import {
  WhatsappIcon,
  InstagramIcon,
  PhoneIcon,
  MailIcon,
  PinIcon,
  ArrowIcon,
} from "@/components/Icons";

export const metadata: Metadata = {
  title: `${site.name} — ${site.role} | Dijital Kartvizit`,
  description: `${site.name} ile hemen iletişime geç: WhatsApp, Instagram, telefon ve web sitesi.`,
};

// QR kod bu sayfaya yönlendirir: onurrhocam.com.tr/kart
// Butonları buradan düzenleyebilirsin; QR koda hiç dokunmana gerek yok.
const waDigits = site.whatsapp.replace(/\D/g, "");

const links = [
  {
    label: "WhatsApp'tan Yaz",
    sub: "En hızlı iletişim",
    href: `https://wa.me/${waDigits}`,
    Icon: WhatsappIcon,
    primary: true,
    external: true,
  },
  {
    label: "Instagram",
    sub: `@${site.handle}`,
    href: site.socials.instagram,
    Icon: InstagramIcon,
    external: true,
  },
  {
    label: "Beni Ara",
    sub: site.phone,
    href: `tel:${site.phone.replace(/\s/g, "")}`,
    Icon: PhoneIcon,
    external: false,
  },
  {
    label: "E-posta Gönder",
    sub: site.email,
    href: `mailto:${site.email}`,
    Icon: MailIcon,
    external: false,
  },
  {
    label: "Web Siteme Git",
    sub: "Paketler, yorumlar ve başarı hikayeleri",
    href: "/",
    Icon: ArrowIcon,
    external: false,
  },
];

export default function KartPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-forest px-5 py-12">
      {/* dekoratif ışıltılar */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sun/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-forest-soft/40 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* Kart başlığı */}
        <div className="flex flex-col items-center text-center">
          {/* Avatar — fotoğraf eklemek için public/onur.jpg koyup <img>'e çevirebiliriz */}
          <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-sun/70 bg-forest-deep font-display text-3xl font-extrabold text-sun shadow-sun">
            OA
          </div>
          <h1 className="mt-5 font-display text-2xl font-extrabold text-white">
            {site.name}
          </h1>
          <p className="mt-1 text-sm font-semibold text-sun">{site.role}</p>
          <p className="mt-3 max-w-xs text-sm text-mint/80">{site.motto}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-mint/90">
            <PinIcon className="h-3.5 w-3.5" />
            {site.location}
          </span>
        </div>

        {/* Butonlar */}
        <div className="mt-8 space-y-3">
          {links.map(({ label, sub, href, Icon, primary, external }) => {
            const cls = primary
              ? "bg-sun text-forest-deep shadow-sun"
              : "bg-white/95 text-forest-deep shadow-card";
            const inner = (
              <>
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                    primary ? "bg-forest-deep/10" : "bg-forest/8"
                  } text-forest`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-bold leading-tight">
                    {label}
                  </span>
                  <span className="block truncate text-xs font-medium text-slate-muted">
                    {sub}
                  </span>
                </span>
              </>
            );
            const shared = `group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-transform hover:-translate-y-0.5 ${cls}`;

            return external ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={shared}
              >
                {inner}
              </a>
            ) : (
              <Link key={label} href={href} className={shared}>
                {inner}
              </Link>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-mint/50">
          © {site.name} · {site.role}
        </p>
      </div>
    </main>
  );
}
