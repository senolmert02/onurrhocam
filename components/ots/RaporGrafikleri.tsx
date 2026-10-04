'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { CizgiGrafigi, type Nokta } from './Grafik';
import { Kart } from './Parcalar';

/** Tek easing — spec §2.1 `--ease-ots`. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Sunucudan gelen günlük nokta (lib/ots/hesap.ts `GunNoktasi`). */
export type GunlukNokta = {
  gun: string;
  etiket: string;
  uyum: number;
  soru: number;
  sure: number;
  gorevVar: boolean;
};

const ARALIKLAR = [
  { anahtar: 'hafta', etiket: '1 hafta', gun: 7 },
  { anahtar: 'ay', etiket: '1 ay', gun: 30 },
] as const;

const OLCULER = [
  { anahtar: 'uyum', etiket: 'Uyum', baslik: 'Program uyumu', birim: '%', sifirdanBasla: true },
  { anahtar: 'soru', etiket: 'Soru', baslik: 'Çözülen soru', birim: ' soru', sifirdanBasla: true },
  { anahtar: 'sure', etiket: 'Süre', baslik: 'Çalışma süresi', birim: ' dk', sifirdanBasla: true },
] as const;

type OlcuAnahtari = (typeof OLCULER)[number]['anahtar'];

/**
 * Rapordaki eğilim grafikleri — spec §8 "Rapor".
 *
 * Üstte zaman aralığı (1 hafta / 1 ay), noktalar günlük. lg altında üç ölçü tek
 * kartta sekmeli, lg ve üstünde yan yana üç kart; aralık seçimi ikisinde de
 * ortak, çünkü tek bileşen.
 *
 * Props yalnızca veri taşır (fonksiyon yok) — sunucu bileşeninden çağrılabilir.
 */
export function RaporGrafikleri({
  gunler,
  yukseklik = 150,
}: {
  gunler: GunlukNokta[];
  yukseklik?: number;
}) {
  const kimlik = useId();
  const azalt = useReducedMotion() === true;
  const [aralik, setAralik] = useState<(typeof ARALIKLAR)[number]['anahtar']>('hafta');
  const [olcu, setOlcu] = useState(0);

  const secilenAralik = ARALIKLAR.find((a) => a.anahtar === aralik) ?? ARALIKLAR[0];
  const dilim = gunler.slice(-secilenAralik.gun);

  /**
   * Uyumda, görev atanmamış günler atlanır: payda sıfır olduğu için 0 çıkıyor
   * ama bu "yapmadı" değil "program yoktu" demek. Soru ve sürede 0 gerçek bir
   * değerdir, kalır.
   */
  const noktalar = (anahtar: OlcuAnahtari): Nokta[] =>
    dilim
      .filter((g) => (anahtar === 'uyum' ? g.gorevVar : true))
      .map((g) => ({ etiket: g.etiket, deger: g[anahtar] }));

  const altBaslik = `${secilenAralik.etiket} · günlük`;
  const sekmeId = (i: number) => `${kimlik}-olcu-${i}`;
  const panelId = `${kimlik}-panel`;
  const secili = OLCULER[Math.min(olcu, OLCULER.length - 1)];

  // Ok tuşları sekmeler arasında dolaşır (WAI-ARIA tabs deseni).
  const tusla = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const son = OLCULER.length - 1;
    const yeni =
      e.key === 'Home' ? 0 : e.key === 'End' ? son : e.key === 'ArrowRight' ? (olcu + 1) % OLCULER.length : (olcu + son) % OLCULER.length;
    setOlcu(yeni);
    document.getElementById(sekmeId(yeni))?.focus();
  };

  const aralikSecici = (
    <div
      role="group"
      aria-label="Zaman aralığı"
      className="grid grid-cols-2 gap-1 rounded-[10px] border border-ots-line-strong p-1 sm:w-auto sm:grid-flow-col"
    >
      {ARALIKLAR.map((a) => {
        const etkin = a.anahtar === aralik;
        return (
          <button
            key={a.anahtar}
            type="button"
            onClick={() => setAralik(a.anahtar)}
            aria-pressed={etkin}
            className={`h-10 rounded-[8px] px-3 text-[14px] font-semibold transition-[background-color,color,box-shadow] duration-150 ease-[var(--ease-ots)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ots-gold-deep focus-visible:ring-offset-2 focus-visible:ring-offset-ots-surface lg:h-8 lg:text-[13px] ${
              etkin
                ? 'bg-ots-raised text-ots-ink shadow-[inset_0_0_0_1px_var(--color-ots-line-strong)]'
                : 'text-ots-soft hover:text-ots-ink'
            }`}
          >
            {a.etiket}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* lg altı: tek kart — aralık + ölçü sekmeleri + grafik */}
      <div className="lg:hidden">
        <Kart baslik="Eğilim" altBaslik={altBaslik} sag={aralikSecici}>
          <div
            role="tablist"
            aria-label="Grafik ölçüsü"
            onKeyDown={tusla}
            className="mb-4 grid grid-cols-3 gap-1 rounded-[10px] border border-ots-line-strong p-1"
          >
            {OLCULER.map((o, i) => {
              const etkin = i === olcu;
              return (
                <button
                  key={o.anahtar}
                  id={sekmeId(i)}
                  type="button"
                  role="tab"
                  aria-selected={etkin}
                  aria-controls={panelId}
                  tabIndex={etkin ? 0 : -1}
                  onClick={() => setOlcu(i)}
                  className={`h-11 rounded-[8px] text-[14px] font-semibold transition-[background-color,color,box-shadow] duration-150 ease-[var(--ease-ots)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ots-gold-deep focus-visible:ring-offset-2 focus-visible:ring-offset-ots-surface ${
                    etkin
                      ? 'bg-ots-raised text-ots-ink shadow-[inset_0_0_0_1px_var(--color-ots-line-strong)]'
                      : 'text-ots-soft hover:text-ots-ink'
                  }`}
                >
                  {o.etiket}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${secili.anahtar}-${aralik}`}
              id={panelId}
              role="tabpanel"
              aria-labelledby={sekmeId(olcu)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: azalt ? 0 : 0.16, ease: EASE }}
            >
              <p className="mb-2 text-[13px] font-semibold text-ots-soft">{secili.baslik}</p>
              <CizgiGrafigi
                seriler={[{ ad: secili.baslik, noktalar: noktalar(secili.anahtar) }]}
                birim={secili.birim}
                sifirdanBasla={secili.sifirdanBasla}
                yukseklik={yukseklik}
              />
            </motion.div>
          </AnimatePresence>
        </Kart>
      </div>

      {/* lg+: aralık bir kez, altında üç grafik yan yana */}
      <div className="hidden lg:block">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[15px] font-bold tracking-[-0.01em] text-ots-ink">Eğilim</h2>
            <p className="mt-0.5 text-[13px] text-ots-faint">{altBaslik}</p>
          </div>
          {aralikSecici}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {OLCULER.map((o) => (
            <Kart key={o.anahtar} baslik={o.baslik}>
              <CizgiGrafigi
                seriler={[{ ad: o.baslik, noktalar: noktalar(o.anahtar) }]}
                birim={o.birim}
                sifirdanBasla={o.sifirdanBasla}
                yukseklik={yukseklik}
              />
            </Kart>
          ))}
        </div>
      </div>
    </>
  );
}
