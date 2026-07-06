"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/lib/content";

const BRAND = `@${site.handle}`; // "@onurrhocam"

export function Preloader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sayfa hazır olunca kısa bir marka gösterimi sonrası kapan
    const t = setTimeout(() => setLoading(false), 2300);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!loading) document.body.style.overflow = "";
  }, [loading]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="preloader"
          exit={{ y: "-100%", borderBottomLeftRadius: "50% 12%", borderBottomRightRadius: "50% 12%" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-forest-deep"
        >
          {/* Logo */}
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative block h-20 w-20 overflow-hidden rounded-full border-4 border-sun bg-white shadow-sun"
          >
            <Image
              src="/logo.jpg"
              alt="logo"
              fill
              sizes="80px"
              className="scale-110 object-cover"
              priority
            />
          </motion.span>

          {/* Harf harf marka adı */}
          <div className="mt-6 flex overflow-hidden font-display text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
            {BRAND.split("").map((ch, i) => (
              <motion.span
                key={i}
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.35 + i * 0.055,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={ch === "@" ? "text-sun" : ""}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          {/* Motto */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.5 }}
            className="mt-3 text-sm font-semibold tracking-wider text-mint/70"
          >
            Disiplin + İstikrar = <span className="text-sun">Başarı</span>
          </motion.p>

          {/* İlerleme çizgisi */}
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.9, ease: "easeInOut" }}
            style={{ originX: 0 }}
            className="absolute bottom-0 left-0 h-1 w-full bg-sun"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
