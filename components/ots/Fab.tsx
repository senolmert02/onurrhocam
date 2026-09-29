'use client';

import { Plus } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

import { useKlavyeAcik } from './hooks/useKlavyeAcik';
import { ODAK_HALKASI } from './Parcalar';

/**
 * Tek elle erişim düğmesi — spec §5.5 / §6. Sayfa başına en fazla bir tane.
 *
 * Yalnızca lg altında görünür; masaüstünde aynı eylem `SayfaBasi` düğmesinde.
 * Aşağı kaydırınca gizlenir, yukarı kaydırınca döner (12px eşik, rAF ile
 * kısılmış); klavye açıkken tamamen ekran dışına çıkar. Gizliyken `inert` —
 * Tab sırasına ve ekran okuyucuya görünmez. Azaltılmış harekette kaydırma
 * gizlemesi yok, FAB hep yerinde.
 *
 * Önceden dört sayfada ayrı kopyası vardı ve gizlenme mesafeleri farklıydı
 * (96/120/160px, `translate-y-full`); bir kısmı safe-area'lı telefonda ekranın
 * altında altın bir şerit bırakıyordu.
 */

/** 56px düğme + 68px alt ofset (3.5rem sekme çubuğu + 0.75rem) + ≤34px safe-area + pay. */
const GIZLI_Y = 176;
const KAYDIRMA_ESIGI = 12;
const EASE = [0.22, 1, 0.36, 1] as const;

export function Fab({ etiket, onClick }: { etiket: string; onClick: () => void }) {
  const azalt = useReducedMotion() === true;
  const klavyeAcik = useKlavyeAcik();
  const [kaydirmaGizli, setKaydirmaGizli] = useState(false);

  useEffect(() => {
    if (azalt) return;
    let sonY = window.scrollY;
    let bekleyen = false;

    function kaydir() {
      if (bekleyen) return;
      bekleyen = true;
      requestAnimationFrame(() => {
        bekleyen = false;
        const y = window.scrollY;
        const fark = y - sonY;
        if (Math.abs(fark) < KAYDIRMA_ESIGI) return;
        // Sayfanın en üstünde her zaman görünür
        setKaydirmaGizli(fark > 0 && y > 80);
        sonY = y;
      });
    }

    window.addEventListener('scroll', kaydir, { passive: true });
    return () => window.removeEventListener('scroll', kaydir);
  }, [azalt]);

  const gizli = klavyeAcik || (!azalt && kaydirmaGizli);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={etiket}
      inert={gizli}
      initial={false}
      animate={{ y: gizli ? GIZLI_Y : 0 }}
      transition={{ duration: azalt ? 0 : 0.15, ease: EASE }}
      className={
        'yazdirma-disi fixed right-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-30 ' +
        'grid h-14 w-14 place-items-center rounded-full bg-ots-gold text-ots-panel ' +
        'shadow-[var(--shadow-ots-gold)] select-none touch-manipulation hover:bg-ots-gold-hover ' +
        `active:scale-[0.98] motion-reduce:active:scale-100 lg:hidden ${ODAK_HALKASI}`
      }
    >
      <Plus size={24} strokeWidth={2.5} aria-hidden />
    </motion.button>
  );
}
