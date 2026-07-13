"use client";

import { packages } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { CheckIcon, ArrowIcon } from "./Icons";

export function Packages() {
  return (
    <section id="paketler" className="relative overflow-hidden bg-forest py-24 text-white sm:py-32">
      {/* dekoratif */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-sun/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-sun">
            Koçluk Paketleri
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-balance sm:text-4xl">
            Sana uygun paketi seç
          </h2>
          <p className="mt-4 text-lg text-mint/80">
            Hangisinin sana uygun olduğundan emin değilsen, ücretsiz ön
            görüşmede birlikte karar veririz.
          </p>
        </Reveal>

        <RevealGroup className="mt-16 grid items-start gap-6 md:grid-cols-3">
          {packages.map((p) => (
            <RevealItem
              key={p.name}
              className={`group relative flex flex-col rounded-3xl p-6 transition-transform hover:-translate-y-2 lg:p-8 ${
                p.featured
                  ? "border-2 border-sun bg-white text-slate shadow-sun md:-mt-4"
                  : "border border-white/15 bg-white/[0.06] backdrop-blur"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-sun px-3 py-1 text-xs font-bold text-forest-deep shadow-sun lg:px-4 lg:py-1.5 lg:text-sm">
                  ⭐ En Çok Tercih Edilen
                </span>
              )}
              <h3
                className={`font-display text-2xl font-extrabold ${
                  p.featured ? "text-forest-deep" : "text-white"
                }`}
              >
                {p.name}
              </h3>
              <p
                className={`mt-1.5 text-sm ${
                  p.featured ? "text-slate-muted" : "text-mint/70"
                }`}
              >
                {p.subtitle}
              </p>

              <ul
                className={`mt-6 space-y-3.5 border-t pt-6 ${
                  p.featured ? "border-forest/10" : "border-white/10"
                }`}
              >
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm font-medium">
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                        p.featured ? "bg-sun/30 text-forest" : "bg-sun/20 text-sun"
                      }`}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </span>
                    <span className={p.featured ? "text-slate" : "text-white/90"}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#iletisim"
                className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition-all ${
                  p.featured
                    ? "bg-forest text-white hover:bg-forest-deep"
                    : "border border-sun/50 text-sun hover:bg-sun hover:text-forest-deep"
                }`}
              >
                Başvuru Yap
                <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.1} className="mt-12 text-center text-sm text-mint/70">
          Ücretler pakete ve sürece göre belirlenir — net bilgiyi{" "}
          <a href="#iletisim" className="font-bold text-sun underline-offset-4 hover:underline">
            ücretsiz ön görüşmede
          </a>{" "}
          konuşuruz.
        </Reveal>
      </div>
    </section>
  );
}
