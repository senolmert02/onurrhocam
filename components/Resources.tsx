"use client";

import { resources } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { NamedIcon, DownloadIcon } from "./Icons";

export function Resources() {
  return (
    <section id="kaynaklar" className="relative overflow-hidden bg-forest py-24 text-white sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sun/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-sun">
            Hediyem olsun 🎁
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-balance sm:text-4xl">
            Ücretsiz Kaynaklar
          </h2>
          <p className="mt-4 text-lg text-mint/80">
            Hemen indirip bugün kullanmaya başlayabileceğin araçlar.
          </p>
        </Reveal>

        <RevealGroup
          className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
          stagger={0.07}
        >
          {resources.map((r) => (
            <RevealItem key={r.title}>
              <a
                href={r.href}
                className="group flex h-full flex-col items-center rounded-3xl border border-white/15 bg-white/[0.06] p-4 text-center backdrop-blur transition-all hover:-translate-y-1.5 hover:border-sun/50 hover:bg-white/10 sm:p-6"
              >
                <span className="grid h-13 w-13 place-items-center rounded-2xl bg-sun/20 text-sun transition-colors group-hover:bg-sun group-hover:text-forest-deep">
                  <NamedIcon name={r.icon} className="h-6.5 w-6.5" />
                </span>
                <h3 className="mt-4 font-display font-bold">{r.title}</h3>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-mint/70">
                  {r.desc}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-sun">
                  <DownloadIcon className="h-4 w-4" />
                  İndir
                </span>
              </a>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
