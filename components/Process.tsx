"use client";

import { motion } from "motion/react";
import { processSteps } from "@/lib/content";
import { Reveal } from "./Reveal";
import { ArrowDownIcon } from "./Icons";

export function Process() {
  return (
    <section id="surec" className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-forest">
            Nasıl çalışıyoruz?
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-forest-deep text-balance sm:text-4xl">
            Koçluk Süreci
          </h2>
          <p className="mt-4 text-lg text-slate-muted">
            İlk görüşmeden hedefe kadar 5 net adım.
          </p>
        </Reveal>

        <div className="relative mt-14">
          {/* Dikey çizgi */}
          <motion.span
            className="absolute left-[27px] top-2 w-0.5 bg-gradient-to-b from-sun via-forest/30 to-forest sm:left-1/2 sm:-translate-x-1/2"
            initial={{ height: 0 }}
            whileInView={{ height: "100%" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />

          <ol className="space-y-8">
            {processSteps.map((step, i) => (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className={`relative flex items-start gap-5 sm:w-[calc(50%+28px)] ${
                  i % 2 === 1 ? "sm:ml-auto sm:flex-row" : "sm:flex-row-reverse sm:text-right"
                }`}
              >
                <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-paper bg-forest font-display text-lg font-extrabold text-sun shadow-card">
                  {i + 1}
                </span>
                <div
                  className={`flex-1 rounded-2xl border border-forest/10 bg-white p-5 shadow-sm transition-transform hover:-translate-y-1 ${
                    i % 2 === 1 ? "" : "sm:text-right"
                  }`}
                >
                  <h3 className="font-display text-lg font-bold text-forest-deep">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-muted">
                    {step.text}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>

        <Reveal delay={0.2} className="mt-10 text-center sm:mt-12">
          <a
            href="#iletisim"
            className="inline-flex items-center gap-2 rounded-full bg-sun px-7 py-4 font-display font-bold text-forest-deep shadow-sun transition-transform hover:-translate-y-0.5"
          >
            <span className="sm:hidden">Ücretsiz Ön Görüşme</span>
            <span className="hidden sm:inline">İlk adımı at — Ücretsiz Ön Görüşme</span>
            <ArrowDownIcon className="h-5 w-5 rotate-[-90deg]" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
