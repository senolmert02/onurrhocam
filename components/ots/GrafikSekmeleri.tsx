'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { CizgiGrafigi, type Seri } from './Grafik';

/** Tek easing — spec §2.1 `--ease-ots`. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type GrafikSekmesi = {
  /** Sekme kimliği — benzersiz, ASCII. */
  anahtar: string;
  /** Segmented düğmedeki kısa etiket ("Uyum", "Soru", "Süre"). */
  etiket: string;
  /** Panelin üstündeki başlık ve alt başlık. */
  baslik: string;
  altBaslik?: string;
  birim?: string;
  sifirdanBasla?: boolean;
  seriler: Seri[];
};

/**
 * lg altında üç çizgi grafiğini tek kartta sekmeli gösterir — spec §8 "Rapor",
 * §5.2 "sekmeli tek kart".
 *
 * Props yalnızca VERİ taşır (fonksiyon yok) — sunucu bileşeninden çağrılır
 * (RSC kuralı). Segmented kontrol `SegmentliSecim`'in reçetesini izler ama
 * form girdisi değil, `tablist`tir: seçenek `h-11` (44px dokunma hedefi),
 * seçili hâl `raised` zemin + `line-strong` iç halka. Panel geçişi
 * `AnimatePresence mode="wait"` 160 ms, yalnızca opacity/transform;
 * azaltılmış harekette anında.
 */
export function GrafikSekmeleri({
  sekmeler,
  yukseklik = 150,
}: {
  sekmeler: GrafikSekmesi[];
  yukseklik?: number;
}) {
  const kimlik = useId();
  const azalt = useReducedMotion() === true;
  const [etkin, setEtkin] = useState(0);

  if (sekmeler.length === 0) return null;

  const secili = sekmeler[Math.min(etkin, sekmeler.length - 1)];
  const sekmeId = (i: number) => `${kimlik}-sekme-${i}`;
  const panelId = `${kimlik}-panel`;

  // Ok tuşları sekmeler arasında dolaşır (WAI-ARIA tabs deseni).
  const tusla = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const son = sekmeler.length - 1;
    const yeni =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? son
          : e.key === 'ArrowRight'
            ? (etkin + 1) % sekmeler.length
            : (etkin - 1 + sekmeler.length) % sekmeler.length;
    setEtkin(yeni);
    document.getElementById(sekmeId(yeni))?.focus();
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Grafik seçimi"
        onKeyDown={tusla}
        className="grid gap-1 rounded-[10px] border border-ots-line-strong p-1"
        style={{ gridTemplateColumns: `repeat(${sekmeler.length}, minmax(0, 1fr))` }}
      >
        {sekmeler.map((s, i) => {
          const aktif = i === etkin;
          return (
            <button
              key={s.anahtar}
              id={sekmeId(i)}
              type="button"
              role="tab"
              aria-selected={aktif}
              aria-controls={panelId}
              tabIndex={aktif ? 0 : -1}
              onClick={() => setEtkin(i)}
              className={`flex h-11 lg:h-9 select-none items-center justify-center truncate rounded-[8px] px-2 text-[14px] font-semibold transition-[background-color,color,box-shadow] duration-150 ease-[var(--ease-ots)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ots-gold-deep focus-visible:ring-offset-2 focus-visible:ring-offset-ots-surface ${
                aktif
                  ? 'bg-ots-raised text-ots-ink shadow-[inset_0_0_0_1px_var(--color-ots-line-strong)]'
                  : 'text-ots-soft hover:text-ots-ink'
              }`}
            >
              {s.etiket}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={secili.anahtar}
          id={panelId}
          role="tabpanel"
          aria-labelledby={sekmeId(etkin)}
          initial={azalt ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={azalt ? undefined : { opacity: 0 }}
          transition={{ duration: azalt ? 0 : 0.16, ease: EASE }}
        >
          <div className="mb-3">
            <h3 className="font-display text-[16px] font-bold tracking-[-0.01em] text-ots-ink">
              {secili.baslik}
            </h3>
            {secili.altBaslik && (
              <p className="mt-0.5 text-[13px] leading-snug text-ots-faint">{secili.altBaslik}</p>
            )}
          </div>
          <CizgiGrafigi
            seriler={secili.seriler}
            birim={secili.birim}
            sifirdanBasla={secili.sifirdanBasla}
            yukseklik={yukseklik}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
