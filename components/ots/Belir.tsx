'use client';

import { motion, useReducedMotion } from 'motion/react';

/** Tek easing — spec §2.1 `--ease-ots`. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * İlk ekranın altındaki kartlar için görünür olunca bir kez beliren sarmalayıcı
 * — spec §6 "Belir".
 *
 * `Kart` sunucu bileşeni kalır; hareket bu ince istemci katmanında yaşar
 * (`whileInView` doğrudan `Kart`'a konmaz — spec §9/13). Yalnızca `opacity` ve
 * `transform`; `once: true` — kaydırmaya bağlı sürekli animasyon yok.
 * Azaltılmış hareket tercihinde içerik beklemeden görünür — ama bu karar render'da
 * VERİLMEZ: sunucu tercihi bilmez, `initial` farklı olursa hidrasyon uyumsuzluğu
 * çıkar ("attributes didn't match", React düzeltmez ve içerik görünmez kalabilir).
 * Sunucu ve istemci aynı başlangıç stilini basar; `.ots-belir-kap` CSS'te
 * `prefers-reduced-motion` altında opaklığı/konumu `!important` ile sıfırlar.
 *
 * `gecikme` milisaniye cinsindendir (kademe için ör. `indeks * 40`, en fazla 6 kademe).
 */
export function Belir({
  children,
  className,
  gecikme = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Milisaniye; kart başına 40 ms kademe önerilir. */
  gecikme?: number;
}) {
  const azalt = useReducedMotion() === true;

  return (
    <motion.div
      className={className ? `ots-belir-kap ${className}` : 'ots-belir-kap'}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: azalt ? 0 : 0.3, ease: EASE, delay: azalt ? 0 : gecikme / 1000 }}
    >
      {children}
    </motion.div>
  );
}
