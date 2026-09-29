/**
 * ÖTS arayüzünün tekrar eden parçaları — docs/ots-tasarim-spec.md §3–§4.
 *
 * Tek kaynak: sayfalardaki elle yazılmış düğme/rozet sınıfları buradaki
 * sabitlere bağlanır. Tüm renkler `--color-ots-*` tokenlarından gelir; gradyan,
 * iç parlaklık, renkli gölge ve neon nokta yoktur.
 *
 * Bu dosya SUNUCU bileşeni kalır ('use client' YOK) — `Kart` ve arkadaşları
 * sunucuda render edilir. Hareket gereken tek parça (`Ilerleme`) ayrı istemci
 * modülünden yeniden dışa aktarılır.
 *
 * Durum renkleri her zaman bir metin etiketiyle birlikte gösterilir — renk tek
 * başına anlam taşımaz.
 */

import type { LucideIcon } from 'lucide-react';

import type { DurumBandi } from '@/lib/ots/hesap';

export { Ilerleme } from './Ilerleme';

/* ------------------------------------------------------------------- Düğmeler
   Yoğunluk: lg altı dokunmatik ölçü (44px hedef, 15px metin); lg ve üstü fare
   ölçüsü (36px düğme, 32px ikon düğmesi, 13.5px metin, 16px ikon). Masaüstünde
   telefon ölçüsü her şeyi şişirip kenar menüyü taşırıyordu. */

/** Odak halkası — düğme, bağlantı ve çip gibi her etkileşimli öğede aynı. */
export const ODAK_HALKASI =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ots-gold-deep ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-ots-bg';

/* Basma geri bildirimi, geçiş ve devre dışı hâli — boyut/yarıçap içermez ki
   hayalet ve ikon düğmeleri çakışmadan kendi ölçülerini verebilsin. */
const ETKILESIM =
  'select-none touch-manipulation ' +
  'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-[var(--ease-ots)] ' +
  'active:scale-[0.98] motion-reduce:active:scale-100 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100';

/** Spec §4.1 temel düğme — tüm dolgulu/çerçeveli düğmeler bunun üstüne kurulur. */
export const DUGME_TEMELI =
  'inline-flex items-center justify-center gap-2 rounded-[10px] text-[15px] font-semibold leading-none ' +
  'min-h-11 px-4 lg:min-h-9 lg:gap-1.5 lg:rounded-lg lg:px-3.5 lg:text-[13.5px] lg:[&_svg]:size-4 ' +
  `${ETKILESIM} ${ODAK_HALKASI}`;

/** Birincil eylem — düz altın dolgu, lacivert metin. Sayfa başına en fazla 1. */
export const DUGME_ALTIN =
  `${DUGME_TEMELI} bg-ots-gold text-ots-panel shadow-[var(--shadow-ots-gold)] ` +
  'hover:bg-ots-gold-hover active:shadow-none';

/** Lacivert dolgu — segmented seçili, giriş dışı önemli onay. Altınla yan yana durmaz. */
export const DUGME_LACIVERT =
  `${DUGME_TEMELI} bg-ots-raised text-ots-ink border border-ots-line-strong hover:bg-ots-line`;

/** İkincil eylem — çerçeveli, metin ink (soft değil; solgun düğme pasif okunur). */
export const DUGME_SESSIZ =
  `${DUGME_TEMELI} bg-ots-surface text-ots-ink border border-ots-line-strong ` +
  'hover:border-ots-faint hover:bg-ots-raised';

/** Metin bağlantısını 44px dokunma hedefine çıkarır — "Tümü →", "Vazgeç", "Geri al". */
export const DUGME_HAYALET =
  'inline-flex items-center justify-center gap-2 rounded-lg text-[14px] font-semibold leading-none ' +
  'min-h-11 px-2 -mx-2 lg:min-h-8 lg:text-[13px] lg:[&_svg]:size-4 ' +
  `text-ots-gold-ink hover:bg-ots-gold-tint ${ETKILESIM} ${ODAK_HALKASI}`;

/** Tehlike, ilk tık — çerçeveli. */
export const DUGME_TEHLIKE =
  `${DUGME_TEMELI} bg-ots-surface text-ots-kirmizi border border-ots-kirmizi/50 hover:bg-ots-kirmizi-tint`;

/** Tehlike, onay adımı — dolu. Dolgu `kirmizi-dolgu` (açık `kirmizi` dolguda kullanılmaz). */
export const DUGME_TEHLIKE_DOLU =
  `${DUGME_TEMELI} bg-ots-kirmizi-dolgu text-ots-ink hover:bg-ots-kirmizi-hover`;

/** Kare ikon düğmesi — kapat, kalem, hafta okları. 44×44, `aria-label` zorunlu. */
export const DUGME_IKON =
  'grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-ots-line-strong ' +
  'lg:h-8 lg:w-8 lg:rounded-lg lg:[&_svg]:size-4 ' +
  `bg-ots-surface text-ots-soft hover:bg-ots-raised hover:text-ots-ink ${ETKILESIM} ${ODAK_HALKASI}`;

/* ---------------------------------------------------------------------- Kart */

export function Kart({
  baslik,
  altBaslik,
  ikon: Ikon,
  sag,
  children,
  className = '',
}: {
  baslik?: string;
  altBaslik?: string;
  ikon?: LucideIcon;
  sag?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-ots-line bg-ots-surface p-4 shadow-ots sm:p-5 ${className}`}
    >
      {(baslik || sag) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {Ikon && (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-ots-gold-tint text-ots-gold-ink lg:h-8 lg:w-8 lg:rounded-lg lg:[&_svg]:size-4">
                <Ikon size={18} strokeWidth={2} aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              {baslik && (
                <h2 className="font-display text-[16px] font-bold tracking-[-0.01em] text-ots-ink lg:text-[15px]">
                  {baslik}
                </h2>
              )}
              {altBaslik && (
                <p className="mt-0.5 text-[13px] leading-snug text-ots-faint">{altBaslik}</p>
              )}
            </div>
          </div>
          {/* Mobilde başlığın altına iner, sm'den itibaren sağa oturur */}
          {sag && <div className="w-full sm:w-auto sm:shrink-0">{sag}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/* ---------------------------------------------------------------- İstatistik */

export function Sayac({
  etiket,
  deger,
  alt,
  ikon: Ikon,
  vurgu,
}: {
  etiket: string;
  deger: string | number;
  alt?: string;
  ikon?: LucideIcon;
  vurgu?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3.5 shadow-ots sm:p-4 ${
        vurgu ? 'border-ots-gold-deep/40 bg-ots-gold-tint' : 'border-ots-line bg-ots-surface'
      }`}
    >
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-ots-faint">
        {Ikon && (
          <Ikon
            size={16}
            strokeWidth={2}
            aria-hidden
            className={`shrink-0 ${vurgu ? 'text-ots-gold-ink' : 'text-ots-faint'}`}
          />
        )}
        <p className="min-w-0 truncate">{etiket}</p>
      </div>
      <p className="ots-sayi mt-2 font-display text-[24px] font-bold leading-none text-ots-ink sm:text-[28px] lg:text-[24px]">
        {deger}
      </p>
      {alt && <p className="mt-1.5 text-[12px] text-ots-faint">{alt}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------- Rozetler */

export type RozetTonu = 'notr' | 'yesil' | 'sari' | 'turuncu' | 'kirmizi';

const ROZET_TABANI =
  'inline-flex items-center gap-1.5 rounded-md px-2 py-[3px] text-[12px] font-semibold leading-4 whitespace-nowrap';

/* Sabit tint zeminleri — kenarlık yok, opaklık yok (spec §4.4). */
const ROZET_TONLARI: Record<RozetTonu, string> = {
  notr: 'bg-ots-raised text-ots-soft',
  yesil: 'bg-ots-yesil-tint text-ots-yesil',
  sari: 'bg-ots-gold-tint text-ots-gold-ink',
  turuncu: 'bg-ots-turuncu-tint text-ots-turuncu',
  kirmizi: 'bg-ots-kirmizi-tint text-ots-kirmizi',
};

export function DurumRozeti({ durum }: { durum: DurumBandi }) {
  return (
    <span className={`${ROZET_TABANI} ${ROZET_TONLARI[durum.renk]}`}>
      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {durum.etiket}
    </span>
  );
}

export function Rozet({
  children,
  ton = 'notr',
  className = '',
}: {
  children: React.ReactNode;
  ton?: RozetTonu;
  className?: string;
}) {
  return <span className={`${ROZET_TABANI} ${ROZET_TONLARI[ton]} ${className}`}>{children}</span>;
}

/* ------------------------------------------------------------------- Fark oku */

/** Geçen haftaya göre değişim. Ok yönü ve işaret birlikte verilir. */
export function Fark({ deger, birim = '' }: { deger: number; birim?: string }) {
  if (deger === 0) {
    return <span className="text-[12px] font-medium text-ots-faint">değişim yok</span>;
  }
  const artis = deger > 0;
  return (
    <span
      className={`ots-sayi inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${
        artis ? 'bg-ots-yesil-tint text-ots-yesil' : 'bg-ots-turuncu-tint text-ots-turuncu'
      }`}
    >
      <span aria-hidden>{artis ? '▲' : '▼'}</span>
      <span className="sr-only">{artis ? 'artış' : 'düşüş'}</span> {artis ? '+' : ''}
      {deger}
      {birim}
    </span>
  );
}

/* --------------------------------------------------------------- Boş durumlar */

export function Bos({
  baslik,
  aciklama,
  ikon: Ikon,
  eylem,
}: {
  baslik: string;
  aciklama?: string;
  ikon?: LucideIcon;
  /** İsteğe bağlı tek eylem — DUGME_SESSIZ ile; sayfada FAB/birincil varsa verilmez. */
  eylem?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ots-line-strong/50 bg-ots-raised px-5 py-10 text-center lg:py-8">
      {Ikon && (
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-ots-line bg-ots-surface text-ots-faint lg:h-10 lg:w-10 lg:[&_svg]:size-4">
          <Ikon size={18} strokeWidth={1.75} aria-hidden />
        </span>
      )}
      <p className="font-display text-[15px] font-bold text-ots-ink">{baslik}</p>
      {aciklama && (
        <p className="mx-auto mt-1 max-w-xs text-[14px] leading-relaxed text-ots-soft">{aciklama}</p>
      )}
      {eylem && <div className="mt-4 flex justify-center">{eylem}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- Sayfa başı */

export function SayfaBasi({
  baslik,
  aciklama,
  sag,
}: {
  baslik: string;
  aciklama?: string;
  sag?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em] text-ots-ink sm:text-[26px] lg:text-[22px]">
          {baslik}
        </h1>
        {aciklama && <p className="mt-1 text-[14px] text-ots-soft">{aciklama}</p>}
      </div>
      {sag}
    </div>
  );
}
