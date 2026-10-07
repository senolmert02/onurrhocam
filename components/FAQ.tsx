"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { faqs } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { ChevronIcon } from "./Icons";

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="sss" className="relative py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal className="text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-forest">
            Merak edilenler
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-forest-deep text-balance sm:text-4xl">
            Sık Sorulan Sorular
          </h2>
        </Reveal>

        <RevealGroup className="mt-12 space-y-4" stagger={0.06}>
          {faqs.map((f, i) => {
            const open = openIdx === i;
            return (
              <RevealItem key={f.q}>
                <div
                  className={`overflow-hidden rounded-2xl border transition-colors ${
                    open ? "border-sun/60 bg-sun-pale/60" : "border-forest/10 bg-white"
                  }`}
                >
                  <button
                    onClick={() => setOpenIdx(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    aria-expanded={open}
                  >
                    <span className="font-display text-base font-bold text-forest-deep sm:text-lg">
                      {f.q}
                    </span>
                    <motion.span
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                        open ? "bg-sun text-forest-deep" : "bg-mint text-forest"
                      }`}
                    >
                      <ChevronIcon className="h-5 w-5" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p className="px-6 pb-6 leading-relaxed text-slate-soft">
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>

        <Reveal delay={0.15} className="mt-10 text-center text-slate-muted">
          Başka sorun mu var?{" "}
          <a href="#iletisim" className="font-bold text-forest underline-offset-4 hover:underline">
            Bana ulaş →
          </a>
        </Reveal>
      </div>
    </section>
  );
}
