"use client";

import { successStories } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { ArrowDownIcon } from "./Icons";

export function SuccessStories() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-forest">
            Gerçek sonuçlar
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-forest-deep text-balance sm:text-4xl">
            Başarı Hikayeleri
          </h2>
          <p className="mt-4 text-lg text-slate-muted">
            İlk netten hedefe — rakamlarla gelişim.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {successStories.map((s) => (
            <RevealItem
              key={s.student}
              className="group flex flex-col overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-card"
            >
              <div className="flex items-center justify-between bg-forest px-6 py-4">
                <p className="font-display text-lg font-bold text-white">
                  {s.student}
                </p>
                <span className="rounded-full bg-sun px-3 py-1 text-xs font-bold text-forest-deep">
                  {s.exam}
                </span>
              </div>

              <div className="flex flex-1 flex-col items-center gap-1 p-7 text-center">
                <p className="rounded-xl bg-mint px-4 py-2 text-sm font-semibold text-slate-soft">
                  {s.firstScore}
                </p>
                <ArrowDownIcon className="my-1.5 h-5 w-5 text-sun-deep transition-transform group-hover:translate-y-1" />
                <p className="rounded-xl bg-mint px-4 py-2 text-sm font-bold text-forest">
                  {s.lastScore}
                </p>
                <ArrowDownIcon className="my-1.5 h-5 w-5 text-sun-deep transition-transform group-hover:translate-y-1" />
                <p className="rounded-xl bg-sun px-5 py-2.5 font-display font-bold text-forest-deep shadow-sun">
                  🎉 {s.result}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
