'use client';

import {
  BookMarked,
  CalendarDays,
  ClipboardList,
  FileText,
  History,
  House,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  Settings,
  TrendingUp,
  TriangleAlert,
  UserCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { UYGULAMA } from '@/lib/ots/sabitler';

/**
 * İkon eşlemesi burada, istemci tarafında duruyor.
 *
 * Sunucu bileşeninden istemci bileşenine **fonksiyon geçilemiyor** — ikon
 * bileşenleri de birer fonksiyon. Bu yüzden menü tanımı yalnızca ikonun
 * adını taşıyor, karşılığı burada bulunuyor. `AltSekmeCubugu` ve
 * `DahaFazlaSheet` de aynı haritayı kullanır; tek kaynak.
 */
export const IKONLAR = {
  dashboard: LayoutDashboard,
  ogrenciler: Users,
  program: CalendarDays,
  dikkat: TriangleAlert,
  konu: ListChecks,
  deneme: ClipboardList,
  rapor: FileText,
  haftalik: TrendingUp,
  notlar: NotebookPen,
  onay: UserCheck,
  ayarlar: Settings,
  profil: UserRound,
  anasayfa: House,
  gecmis: History,
  kaynak: BookMarked,
} satisfies Record<string, LucideIcon>;

export type IkonAdi = keyof typeof IKONLAR;

export type MenuOgesi = {
  etiket: string;
  adres: string;
  ikon: IkonAdi;
  rozet?: number;
  /** Alt sekme çubuğu için ≤9 karakterlik kısa ad; yoksa `etiket` görünür. */
  kisaEtiket?: string;
};

/** Lacivert iskelet üstünde odak halkası — offset rengi zemin değil panel. */
export const PANEL_ODAK =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ots-gold-deep ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-ots-panel';

/** Etkin gösterge kayması — spec §6: spring 500/40. Reduced motion'da MotionConfig anında yapar. */
export const GOSTERGE_GECISI = { type: 'spring', stiffness: 500, damping: 40 } as const;

/**
 * Menü öğesi etkin mi?
 *
 * Kök adres yalnızca tam eşleşmede etkin; diğerleri alt yollarıyla birlikte
 * (`/takip/ogrenciler/12` → Öğrenciler). `startsWith` tek başına yetmez:
 * `/takip/program` ile `/takip/programlar` birbirine karışır, bu yüzden
 * eşleşme `/` sınırında aranır.
 */
export function etkinMi(yol: string, adres: string): boolean {
  if (adres === UYGULAMA.kok) return yol === UYGULAMA.kok;
  return yol === adres || yol.startsWith(`${adres}/`);
}

const OGE =
  'relative flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] ' +
  `transition-colors duration-150 ease-ots ${PANEL_ODAK}`;
const OGE_PASIF = 'font-medium text-ots-panel-soft hover:bg-white/[.06] hover:text-ots-panel-ink';
const OGE_ETKIN = 'bg-white/[.08] font-semibold text-ots-gold-bright';

/**
 * Sol kenar menüsü — yalnızca lg ve üstü (spec §5.1, §8).
 *
 * lg altında gezinme `AltSekmeCubugu` + `UstCubuk`'a ait; hamburger yok.
 * Etkin öğe üç işaretle belli oluyor: sol altın şerit, açık zemin ve altın
 * metin. Tek başına renk bırakmıyoruz; `aria-current` da var.
 */
export function KenarMenu({
  ogeler,
  kullaniciAdi,
  rolAdi,
  cikis,
}: {
  ogeler: MenuOgesi[];
  kullaniciAdi: string;
  rolAdi: string;
  cikis: React.ReactNode;
}) {
  const yol = usePathname();

  return (
    <aside
      className="yazdirma-disi sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r
        border-ots-panel-line bg-ots-panel p-3 lg:flex"
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mb-5 pt-1">
          <Marka kullaniciAdi={kullaniciAdi} rolAdi={rolAdi} />
        </div>

        <nav aria-label="Panel menüsü">
          <ul className="flex flex-col gap-0.5">
            {ogeler.map(({ etiket, adres, ikon, rozet }) => {
              const Ikon = IKONLAR[ikon];
              const etkin = etkinMi(yol, adres);
              return (
                <li key={adres}>
                  <Link
                    href={adres}
                    aria-current={etkin ? 'page' : undefined}
                    className={`${OGE} ${etkin ? OGE_ETKIN : OGE_PASIF}`}
                  >
                    {/* Etkin öğenin sol şeridi; sayfa değişince kayar */}
                    {etkin && (
                      <motion.span
                        layoutId="menu-aktif"
                        aria-hidden
                        transition={GOSTERGE_GECISI}
                        className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-ots-gold"
                      />
                    )}
                    <Ikon size={17} strokeWidth={etkin ? 2.25 : 1.75} aria-hidden className="shrink-0" />
                    <span className="flex-1 truncate">{etiket}</span>
                    {rozet ? (
                      <span
                        className="ots-sayi inline-grid h-5 min-w-5 place-items-center rounded-md
                          bg-ots-gold px-1 text-[11px] font-bold text-ots-panel"
                      >
                        {rozet}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="border-t border-ots-panel-line pt-3">{cikis}</div>
    </aside>
  );
}

/** Marka bloğu: düz altın "OH" karesi + ad + kullanıcı satırı (spec §8). */
function Marka({ kullaniciAdi, rolAdi }: { kullaniciAdi: string; rolAdi: string }) {
  return (
    <Link
      href={UYGULAMA.kok}
      className={`flex min-h-10 min-w-0 items-center gap-2.5 rounded-lg px-1 ${PANEL_ODAK}`}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ots-gold
          font-display text-[12px] font-bold text-ots-panel"
      >
        OH
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[14px] font-bold leading-tight tracking-[-0.01em] text-ots-panel-ink">
          OnurrHocam
        </span>
        <span className="block truncate text-[12px] leading-tight text-ots-panel-soft">
          {kullaniciAdi} · {rolAdi}
        </span>
      </span>
    </Link>
  );
}
