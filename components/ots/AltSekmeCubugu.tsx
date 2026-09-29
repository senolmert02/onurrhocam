'use client';

import { MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { DahaFazlaSheet } from './DahaFazlaSheet';
import { useKlavyeAcik } from './hooks/useKlavyeAcik';
import { GOSTERGE_GECISI, IKONLAR, PANEL_ODAK, etkinMi, type MenuOgesi } from './KenarMenu';

/** Birincil yuva sayısı; beşincisi her zaman "Daha fazla". */
const BIRINCIL_SAYISI = 4;

/* Spec §4.11 yuva reçetesi. Etkin görünüm `aria-current`'e bağlı: bağlantılar
   `page`, "Daha fazla" düğmesi (etkin sayfayı barındıran grup) `true` alır.
   Böylece görsel durum ile AT durumu tek kaynaktan gelir. */
const YUVA =
  'relative flex h-14 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium ' +
  'leading-none text-ots-panel-soft aria-[current=page]:font-semibold aria-[current=page]:text-ots-gold-bright ' +
  'aria-[current=true]:font-semibold aria-[current=true]:text-ots-gold-bright ' +
  `active:bg-white/[.06] ${PANEL_ODAK}`;

/** Yuvadaki sayı rozeti — spec §4.11: yalnızca burada 10px'e izin var (rakam, harf değil). */
function YuvaRozeti({ sayi }: { sayi: number }) {
  return (
    <span
      className="ots-sayi absolute right-[calc(50%-16px)] top-2 h-4 min-w-4 rounded-full bg-ots-gold
        px-1 text-center text-[10px] font-bold leading-4 text-ots-panel"
    >
      {sayi}
      <span className="sr-only"> bekleyen</span>
    </span>
  );
}

/** Etkin yuvanın üst çizgisi; sekme değişince kayar. */
function EtkinCizgi() {
  return (
    <motion.span
      layoutId="sekme-aktif"
      aria-hidden
      transition={GOSTERGE_GECISI}
      className="absolute inset-x-4 top-0 h-0.5 rounded-b-full bg-ots-gold"
    />
  );
}

/**
 * Alt sekme çubuğu — lg altı gezinme (spec §4.11, §5.1).
 *
 * Beş yuva: ilk dört birincil sayfa, beşincisi geri kalanları açan
 * "Daha fazla" sheet'i. Etkin sayfa "Daha fazla" içindeyse beşinci yuva
 * etkin görünür. Klavye açıkken (`useKlavyeAcik`) çubuk aşağı kayarak
 * gizlenir — Android'de klavyenin üstünde yüzmesin.
 */
export function AltSekmeCubugu({
  ogeler,
  dahaFazla,
  kocMu,
  kullaniciAdi,
  rolAdi,
  cikis,
  onayRozeti,
}: {
  /** Birincil öğeler; ilk dördü yuva olur. */
  ogeler: MenuOgesi[];
  /** "Daha fazla" sheet'inde listelenen öğeler. */
  dahaFazla: MenuOgesi[];
  kocMu: boolean;
  kullaniciAdi: string;
  rolAdi: string;
  cikis: ReactNode;
  /** Onay bekleyen sayısı; koçta "Daha fazla" yuvasında rozet olur. */
  onayRozeti?: number;
}) {
  const yol = usePathname();
  const klavyeAcik = useKlavyeAcik();
  const [sheetAcik, setSheetAcik] = useState(false);

  const birincil = ogeler.slice(0, BIRINCIL_SAYISI);
  const dahaFazlaEtkin = dahaFazla.some((oge) => etkinMi(yol, oge.adres));
  const dahaFazlaRozeti = kocMu && onayRozeti ? onayRozeti : 0;

  return (
    <>
      <nav
        aria-label="Alt gezinme"
        data-klavye={klavyeAcik ? 'acik' : 'kapali'}
        className="yazdirma-disi fixed inset-x-0 bottom-0 z-30 border-t border-ots-panel-line
          bg-ots-panel pb-[env(safe-area-inset-bottom)] shadow-ots-sheet transition-transform
          duration-150 ease-ots data-[klavye=acik]:translate-y-full lg:hidden"
      >
        <ul className="grid h-14 grid-cols-5">
          {birincil.map(({ etiket, kisaEtiket, adres, ikon, rozet }) => {
            const Ikon = IKONLAR[ikon];
            const etkin = etkinMi(yol, adres);
            return (
              <li key={adres} className="min-w-0">
                <Link href={adres} aria-current={etkin ? 'page' : undefined} className={YUVA}>
                  {etkin && <EtkinCizgi />}
                  <Ikon size={22} strokeWidth={etkin ? 2.5 : 2} aria-hidden />
                  <span className="max-w-full truncate px-1">{kisaEtiket ?? etiket}</span>
                  {rozet ? <YuvaRozeti sayi={rozet} /> : null}
                </Link>
              </li>
            );
          })}

          <li className="min-w-0">
            <button
              type="button"
              onClick={() => setSheetAcik(true)}
              aria-haspopup="dialog"
              aria-expanded={sheetAcik}
              aria-current={dahaFazlaEtkin ? 'true' : undefined}
              className={YUVA}
            >
              {dahaFazlaEtkin && <EtkinCizgi />}
              <MoreHorizontal size={22} strokeWidth={dahaFazlaEtkin ? 2.5 : 2} aria-hidden />
              <span className="max-w-full truncate px-1">Daha fazla</span>
              {dahaFazlaRozeti ? <YuvaRozeti sayi={dahaFazlaRozeti} /> : null}
            </button>
          </li>
        </ul>
      </nav>

      <DahaFazlaSheet
        acik={sheetAcik}
        kapat={() => setSheetAcik(false)}
        ogeler={dahaFazla}
        kullaniciAdi={kullaniciAdi}
        rolAdi={rolAdi}
        cikis={cikis}
      />
    </>
  );
}
