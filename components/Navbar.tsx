"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { nav, ogrenciGirisi, site } from "@/lib/content";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 sm:pt-4"
    >
      <nav
        className={`flex w-full max-w-6xl items-center justify-between rounded-full border px-4 py-2.5 transition-all duration-500 sm:px-5 ${
          scrolled
            ? "border-forest/10 bg-paper/85 shadow-soft backdrop-blur-md"
            : "border-transparent bg-transparent"
        }`}
      >
        <a
          href="#top"
          className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-forest-deep"
        >
          <span className="relative block h-10 w-10 overflow-hidden rounded-full border border-forest/15 bg-white shadow-sm">
            <Image
              src="/logo.jpg"
              alt={`${site.name} logo`}
              fill
              sizes="40px"
              className="scale-110 object-cover"
            />
          </span>
          <span className="hidden leading-tight sm:block">
            {site.name}
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-muted">
              @{site.handle}
            </span>
          </span>
        </a>

        <ul className="hidden items-center gap-0.5 lg:flex">
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="rounded-full px-3.5 py-2 text-sm font-semibold text-slate-soft transition-colors hover:bg-mint hover:text-forest-deep"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {/* Mevcut öğrenciler için; ana çağrı düğmesiyle yarışmasın diye ikincil. */}
          <Link
            href={ogrenciGirisi.href}
            className="hidden rounded-full border border-forest/20 px-4 py-2.5 text-sm font-semibold text-forest-deep transition-colors hover:bg-mint lg:inline-block"
          >
            {ogrenciGirisi.label}
          </Link>

          <a
            href="#iletisim"
            className="hidden rounded-full bg-sun px-5 py-2.5 text-sm font-bold text-forest-deep shadow-sun transition-transform hover:-translate-y-0.5 sm:inline-block"
          >
            📞 Ücretsiz Ön Görüşme
          </a>

          <button
            aria-label="Menü"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-forest/15 bg-paper/70 lg:hidden"
          >
            <span className="relative block h-3.5 w-4.5">
              <span
                className={`absolute left-0 block h-0.5 w-4.5 bg-forest transition-all ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-4.5 bg-forest transition-all ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-4.5 bg-forest transition-all ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-x-4 top-[76px] rounded-3xl border border-forest/10 bg-paper/95 p-3 shadow-soft backdrop-blur-md lg:hidden"
          >
            <ul className="flex flex-col">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl px-4 py-3 font-semibold text-slate-soft transition-colors hover:bg-mint hover:text-forest-deep"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li className="p-1">
                <Link
                  href={ogrenciGirisi.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl border border-forest/20 px-4 py-3 text-center font-semibold text-forest-deep"
                >
                  {ogrenciGirisi.label}
                </Link>
              </li>
              <li className="px-1 pb-1">
                <a
                  href="#iletisim"
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl bg-sun px-4 py-3 text-center font-bold text-forest-deep"
                >
                  📞 Ücretsiz Ön Görüşme
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
