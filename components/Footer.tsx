import Image from "next/image";
import Link from "next/link";
import { nav, ogrenciGirisi, site } from "@/lib/content";
import { InstagramIcon, WhatsappIcon } from "./Icons";

export function Footer() {
  return (
    <footer className="border-t border-forest/10 bg-forest-deep text-white">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <a
              href="#top"
              className="flex items-center gap-2.5 font-display text-xl font-bold"
            >
              <span className="relative block h-10 w-10 overflow-hidden rounded-full bg-white">
                <Image
                  src="/logo.jpg"
                  alt={`${site.name} logo`}
                  fill
                  sizes="40px"
                  className="scale-110 object-cover"
                />
              </span>
              {site.name}
            </a>
            <p className="mt-4 font-display text-lg font-bold text-sun">
              {site.motto}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-mint/60">
              {site.role} · {site.location}
            </p>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row sm:gap-16">
            <div>
              <p className="text-sm font-bold text-sun">Menü</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a
                    href="#top"
                    className="text-sm text-mint/70 transition-colors hover:text-sun"
                  >
                    Ana Sayfa
                  </a>
                </li>
                {nav.map((n) => (
                  <li key={n.href}>
                    <a
                      href={n.href}
                      className="text-sm text-mint/70 transition-colors hover:text-sun"
                    >
                      {n.label}
                    </a>
                  </li>
                ))}
                <li className="pt-1.5">
                  <Link
                    href={ogrenciGirisi.href}
                    className="text-sm font-semibold text-sun/90 transition-colors hover:text-sun"
                  >
                    {ogrenciGirisi.label} →
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-sun">Takip et</p>
              <div className="mt-4 flex gap-3">
                <a
                  href={site.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-mint/80 transition-all hover:-translate-y-0.5 hover:border-sun hover:text-sun"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
                <a
                  href={`https://wa.me/${site.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-mint/80 transition-all hover:-translate-y-0.5 hover:border-sun hover:text-sun"
                >
                  <WhatsappIcon className="h-5 w-5" />
                </a>
              </div>
              <p className="mt-3 text-sm font-semibold text-mint/70">
                @{site.handle}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-mint/50 sm:flex-row">
          <p>© 2026 {site.name}. Tüm hakları saklıdır.</p>
          <p>
            Disiplin + İstikrar = <span className="font-bold text-sun">Başarı</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
