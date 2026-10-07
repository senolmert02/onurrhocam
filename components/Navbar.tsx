"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { nav, ogrenciGirisi, site } from "@/lib/content";
import { LogoIsaret } from "./LogoCizim";

/**
 * Üst menü.
 *
 * - lg+ (1024): logo + isim, bağlantılar, Öğrenci Girişi, ön görüşme düğmesi.
 * - lg altı: logo + isim ve menü düğmesi; tüm bağlantılar ve düğmeler açılır
 *   panelde. Tablette ön görüşme düğmesi de üstte kalır (sm–lg).
 * - Telefonda zemin hep dolu: hero'nun üstünde şeffaf menü yazıyla çakışıyordu.
 * - Panel açıkken sayfa kaymaz; Esc ve bağlantı tıklaması kapatır.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const kapat = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const genislik = () => window.innerWidth >= 1024 && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", kapat);
    window.addEventListener("resize", genislik);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", kapat);
      window.removeEventListener("resize", genislik);
    };
  }, [open]);

  const dolu = scrolled || open;

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4"
    >
      <nav
        className={`relative z-10 flex h-14 w-full max-w-6xl items-center justify-between gap-3 rounded-full border pl-2 pr-2 transition-all duration-500 sm:h-16 sm:pl-3 ${
          dolu
            ? "border-forest/10 bg-paper/90 shadow-soft backdrop-blur-md"
            : "border-forest/10 bg-paper/80 backdrop-blur-md lg:border-transparent lg:bg-transparent lg:backdrop-blur-none"
        }`}
      >
        <a
          href="#top"
          onClick={() => setOpen(false)}
          className="flex min-w-0 items-center gap-2.5 rounded-full pr-2 text-forest-deep"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper ring-1 ring-forest/15 sm:h-11 sm:w-11">
            <LogoIsaret className="h-8 w-8 sm:h-9 sm:w-9" etiket={`${site.markaAdi} logosu`} />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-[15px] font-bold tracking-tight sm:text-lg">
              {site.name}
            </span>
            <span className="block truncate text-[11px] font-semibold uppercase tracking-wider text-slate-muted">
              @{site.handle}
            </span>
          </span>
        </a>

        <ul className="hidden items-center gap-0.5 lg:flex">
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="rounded-full px-3 py-2 text-sm font-semibold text-slate-soft transition-colors hover:bg-mint hover:text-forest-deep xl:px-3.5"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={ogrenciGirisi.href}
            className="hidden rounded-full border border-forest/20 px-4 py-2.5 text-sm font-semibold text-forest-deep transition-colors hover:bg-mint lg:inline-block"
          >
            {ogrenciGirisi.label}
          </Link>

          <a
            href="#iletisim"
            className="hidden rounded-full bg-sun px-4 py-2.5 text-sm font-bold text-forest-deep shadow-sun transition-transform hover:-translate-y-0.5 sm:inline-block lg:px-5"
          >
            <span className="lg:hidden">Ön Görüşme</span>
            <span className="hidden lg:inline">Ücretsiz Ön Görüşme</span>
          </a>

          <button
            type="button"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
            aria-controls="mobil-menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-full bg-forest text-paper transition-colors hover:bg-forest-deep lg:hidden"
          >
            <span className="relative block h-3.5 w-5">
              <span className={`absolute left-0 block h-0.5 w-5 rounded bg-current transition-all duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-1.5 block h-0.5 w-5 rounded bg-current transition-all duration-300 ${open ? "opacity-0" : "opacity-100"}`} />
              <span className={`absolute left-0 block h-0.5 w-5 rounded bg-current transition-all duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <>
            {/* Arka perde — dokununca kapanır */}
            <motion.div
              key="perde"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-forest-deep/30 backdrop-blur-[2px] lg:hidden"
            />
            <motion.div
              key="panel"
              id="mobil-menu"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-3 top-[76px] z-10 max-h-[calc(100dvh-92px)] overflow-y-auto rounded-3xl border border-forest/10 bg-paper p-2 shadow-soft sm:inset-x-4 sm:top-[88px] lg:hidden"
            >
              <ul className="flex flex-col">
                {nav.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i }}
                  >
                    <a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center rounded-2xl px-4 text-[16px] font-semibold text-slate-soft transition-colors hover:bg-mint hover:text-forest-deep"
                    >
                      {item.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-2 grid gap-2 border-t border-forest/10 p-2 pt-3 sm:grid-cols-2">
                <Link
                  href={ogrenciGirisi.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center justify-center rounded-2xl border border-forest/20 px-4 font-semibold text-forest-deep"
                >
                  {ogrenciGirisi.label}
                </Link>
                <a
                  href="#iletisim"
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center justify-center rounded-2xl bg-sun px-4 font-bold text-forest-deep shadow-sun"
                >
                  Ücretsiz Ön Görüşme
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
