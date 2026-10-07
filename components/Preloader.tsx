"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/lib/content";
import { LogoCizim } from "./LogoCizim";

const BRAND = `@${site.handle}`; // "@onurrhocam"

export function Preloader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sayfa hazır olunca kısa bir marka gösterimi sonrası kapan
    // Logo ~1.8 sn'de çizilip doluyor; yazıları da gördükten sonra kapan
    const t = setTimeout(() => setLoading(false), 2700);
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
          {/* Logo — kalemle çiziliyormuş gibi (components/LogoCizim) */}
          <LogoCizim className="h-36 w-36 drop-shadow-[0_0_24px_rgba(244,197,66,0.25)] sm:h-40 sm:w-40" />

          {/* Harf harf marka adı */}
          <div className="mt-6 flex overflow-hidden font-display text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
            {BRAND.split("").map((ch, i) => (
              <motion.span
                key={i}
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 1.2 + i * 0.045,
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
            transition={{ delay: 1.75, duration: 0.5 }}
            className="mt-3 text-sm font-semibold tracking-wider text-mint/70"
          >
            Disiplin + İstikrar = <span className="text-sun">Başarı</span>
          </motion.p>

          {/* İlerleme çizgisi */}
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.4, ease: "easeInOut" }}
            style={{ originX: 0 }}
            className="absolute bottom-0 left-0 h-1 w-full bg-sun"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
