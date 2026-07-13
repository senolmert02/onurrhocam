"use client";

import { stats } from "@/lib/content";
import { RevealGroup, RevealItem } from "./Reveal";
import { Counter } from "./Counter";

export function Stats() {
  return (
    <section id="basarilar" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <RevealGroup className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map((s, i) => (
            <RevealItem
              key={s.label}
              className={`rounded-3xl border p-5 text-center transition-transform hover:-translate-y-1 sm:p-7 ${
                i % 2 === 0
                  ? "border-forest/10 bg-mint/70"
                  : "border-sun/40 bg-sun-pale"
              }`}
            >
              <p className="font-display text-3xl font-extrabold text-forest-deep sm:text-4xl lg:text-5xl">
                <Counter value={s.value} />
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-muted">
                {s.label}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
