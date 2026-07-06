"use client";

import { motion } from "motion/react";
import { heroBadges, site, trustWords } from "@/lib/content";
import { ArrowIcon, CheckIcon } from "./Icons";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20"
    >
      {/* Dekoratif arka plan */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-floaty absolute -left-24 top-24 h-80 w-80 rounded-full bg-sun/25 blur-3xl" />
        <div
          className="animate-floaty absolute -right-20 top-40 h-96 w-96 rounded-full bg-forest/10 blur-3xl"
          style={{ animationDelay: "-4s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(244,197,66,0.16),transparent_55%)]" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Sol: metin */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white/70 px-4 py-1.5 text-sm font-semibold text-forest backdrop-blur"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-sun-deep" />
            YKS & LGS Koçluğu · Birebir Takip
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 font-display text-4xl font-extrabold leading-[1.04] tracking-tight text-forest-deep text-balance sm:text-6xl"
          >
            Hedefine{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">Birlikte</span>
              <motion.span
                className="absolute inset-x-0 bottom-1 -z-0 block h-[0.42em] rounded-md bg-sun/70"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ originX: 0 }}
              />
            </span>{" "}
            Ulaşalım.
          </motion.h1>

          {/* Motto formülü */}
          <motion.div
            variants={item}
            className="mt-6 inline-flex flex-wrap items-center gap-2 font-display text-lg font-bold sm:text-xl"
          >
            <span className="rounded-xl bg-mint px-3.5 py-1.5 text-forest">Disiplin</span>
            <span className="text-slate-muted">+</span>
            <span className="rounded-xl bg-mint px-3.5 py-1.5 text-forest">İstikrar</span>
            <span className="text-slate-muted">=</span>
            <span className="rounded-xl bg-sun px-3.5 py-1.5 text-forest-deep shadow-sun">
              Başarı
            </span>
          </motion.div>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-lg leading-relaxed text-slate-soft text-balance"
          >
            {site.tagline}
          </motion.p>

          <motion.ul variants={item} className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {heroBadges.map((b) => (
              <li
                key={b}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-soft"
              >
                <CheckIcon className="h-4.5 w-4.5 text-forest" />
                {b}
              </li>
            ))}
          </motion.ul>

          <motion.div variants={item} className="mt-9 flex flex-wrap gap-3">
            <a
              href="#iletisim"
              className="group animate-glow inline-flex items-center gap-2 rounded-full bg-sun px-7 py-4 font-display font-bold text-forest-deep transition-transform hover:-translate-y-0.5"
            >
              📞 Ücretsiz Ön Görüşme
              <ArrowIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#iletisim"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-7 py-4 font-display font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-forest-deep"
            >
              📋 Başvuru Yap
            </a>
          </motion.div>
        </motion.div>

        {/* Sağ: portre kartı */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="absolute -inset-3 -z-10 rounded-[2.4rem] bg-gradient-to-br from-sun/60 via-transparent to-forest/30" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border-4 border-white bg-gradient-to-br from-mint via-paper to-sun-pale shadow-soft">
            {/* 🖼️ Onur'un fotoğrafı: public/portrait.jpg ekleyince burayı <Image> ile değiştiririm */}
            <div className="absolute inset-0 grid place-items-center text-center">
              <div className="px-6">
                <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-forest font-display text-3xl font-bold text-sun">
                  OA
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-soft">
                  Fotoğraf alanı
                  <br />
                  <span className="font-normal text-slate-muted">
                    (public/portrait.jpg ekle)
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Yüzen rozetler */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="absolute -bottom-5 -left-6 flex items-center gap-3 rounded-2xl border border-forest/10 bg-white px-4 py-3 shadow-card"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sun/25 text-lg">
              🏆
            </span>
            <div className="text-sm leading-tight">
              <p className="font-bold text-forest-deep">LGS Türkiye 1.&apos;si</p>
              <p className="text-slate-muted">öğrencim arasında</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="absolute -right-4 -top-5 flex items-center gap-2 rounded-2xl border border-forest/10 bg-white px-4 py-2.5 shadow-card"
          >
            <span className="text-lg">📈</span>
            <p className="text-sm font-bold text-forest-deep">Günlük takip</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Akan güven bandı */}
      <div className="relative mt-16 overflow-hidden border-y border-forest/10 bg-forest py-4 sm:mt-20">
        <div className="flex w-max animate-marquee gap-10 pr-10">
          {[...trustWords, ...trustWords].map((w, i) => (
            <span
              key={i}
              className="flex items-center gap-10 whitespace-nowrap text-sm font-bold uppercase tracking-wider text-mint"
            >
              {w}
              <span className="text-sun">★</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
