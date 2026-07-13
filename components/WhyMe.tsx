"use client";

import { whyMe } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { NamedIcon } from "./Icons";

export function WhyMe() {
  return (
    <section className="relative bg-mint/60 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-forest">
            Farkım ne?
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-forest-deep text-balance sm:text-4xl">
            Neden Benimle Çalışmalısın?
          </h2>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whyMe.map((w, i) => (
            <RevealItem
              key={w.title}
              className="group relative overflow-hidden rounded-3xl border border-forest/10 bg-white p-6 transition-all hover:-translate-y-2 hover:shadow-card sm:p-7"
            >
              <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-sun/15 transition-transform duration-500 group-hover:scale-[2.5]" />
              <span className="relative grid h-13 w-13 place-items-center rounded-2xl bg-forest text-sun">
                <NamedIcon name={w.icon} className="h-6.5 w-6.5" />
              </span>
              <h3 className="relative mt-5 font-display text-lg font-bold text-forest-deep">
                {w.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-muted">
                {w.text}
              </p>
              <span className="absolute bottom-4 right-5 font-display text-4xl font-extrabold text-mint-2">
                0{i + 1}
              </span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
