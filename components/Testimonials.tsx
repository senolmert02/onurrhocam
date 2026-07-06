"use client";

import { site, testimonials } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { QuoteIcon, PlayIcon, InstagramIcon } from "./Icons";

export function Testimonials() {
  return (
    <section className="relative bg-mint/50 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-forest">
            Öğrenci & Veli Yorumları
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-forest-deep text-balance sm:text-4xl">
            Onlar anlatsın
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.5fr]">
          {/* Video / Reel alanı */}
          <Reveal className="group relative overflow-hidden rounded-3xl border border-forest/10 bg-forest shadow-card">
            {/* 🎬 Buraya Instagram Reel embed'i veya video gelecek.
                Reel linkini verince gerçek embed ile değiştiririm. */}
            <div className="relative flex aspect-[4/5] flex-col items-center justify-center p-8 text-center lg:aspect-auto lg:h-full">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-sun text-forest-deep shadow-sun transition-transform group-hover:scale-110">
                <PlayIcon className="ml-1 h-9 w-9" />
              </span>
              <p className="mt-6 font-display text-xl font-bold text-white">
                Öğrenci videoları
              </p>
              <p className="mt-2 max-w-[16rem] text-sm text-mint/70">
                Instagram Reel&apos;lerinden başarı hikayeleri
              </p>
              <a
                href={site.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-sun/50 px-5 py-2.5 text-sm font-bold text-sun transition-colors hover:bg-sun hover:text-forest-deep"
              >
                <InstagramIcon className="h-4.5 w-4.5" />
                @{site.handle}
              </a>
            </div>
          </Reveal>

          {/* Yazılı yorumlar */}
          <RevealGroup className="grid gap-5 sm:grid-cols-2">
            {testimonials.map((t, i) => (
              <RevealItem
                key={t.name}
                className={`flex flex-col rounded-3xl border border-forest/10 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1 ${
                  i === 2 ? "sm:col-span-2" : ""
                }`}
              >
                <QuoteIcon className="h-8 w-8 text-sun" />
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-slate-soft">
                  “{t.quote}”
                </p>
                <div className="mt-5 flex items-center gap-3 border-t border-forest/10 pt-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-forest font-bold text-sun">
                    {t.name[0]}
                  </span>
                  <div>
                    <p className="font-bold text-forest-deep">{t.name}</p>
                    <p className="text-sm text-slate-muted">{t.detail}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
