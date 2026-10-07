"use client";

import { testimonials } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { QuoteIcon } from "./Icons";

export function Testimonials() {
  return (
    <section className="relative bg-mint/50 py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-forest">
            Öğrenci & Veli Yorumları
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-forest-deep text-balance sm:text-4xl">
            Onlar anlatsın
          </h2>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <RevealItem
              key={t.name}
              className="flex flex-col rounded-3xl border border-forest/10 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1"
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
    </section>
  );
}
