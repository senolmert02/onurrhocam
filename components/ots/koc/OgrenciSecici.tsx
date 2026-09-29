'use client';

import { ChevronDown } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { GIRDI } from '../Alan';

/**
 * Koçun ekranlarında öğrenci seçici — spec §4.5 select reçetesi (h-12, 16px,
 * `line-strong` sınır, ChevronDown). Kart sarmalayıcısı yok; sayfanın yapışkan
 * şeridine sade bir girdi olarak oturur.
 *
 * Seçim adres çubuğuna `?ogrenci=` olarak yazılır; böylece sayfa yenilenince
 * ya da bağlantı paylaşılınca aynı öğrenci açılır. Diğer arama parametreleri
 * (hafta gibi) korunur.
 */
export function OgrenciSecici({
  ogrenciler,
  secili,
  className = '',
}: {
  ogrenciler: { id: string; adSoyad: string; sinif: string }[];
  secili?: string;
  className?: string;
}) {
  const router = useRouter();
  const yol = usePathname();
  const parametreler = useSearchParams();

  function degistir(id: string) {
    const yeni = new URLSearchParams(parametreler.toString());
    if (id) yeni.set('ogrenci', id);
    else yeni.delete('ogrenci');
    // Öğrenci değişince hafta seçimi anlamını yitirmez, korunur.
    router.push(`${yol}?${yeni.toString()}`);
  }

  if (ogrenciler.length === 0) {
    return (
      <p className={`text-[14px] leading-snug text-ots-soft ${className}`}>
        Aktif öğrenci yok. Önce Öğrenciler sayfasından ekle.
      </p>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <label htmlFor="ogrenci-secici" className="sr-only">
        Öğrenci
      </label>
      <select
        id="ogrenci-secici"
        value={secili ?? ''}
        onChange={(olay) => degistir(olay.target.value)}
        className={`${GIRDI} appearance-none pr-10`}
      >
        <option value="" className="bg-ots-surface text-ots-ink">
          Öğrenci seçin…
        </option>
        {ogrenciler.map((o) => (
          <option key={o.id} value={o.id} className="bg-ots-surface text-ots-ink">
            {o.adSoyad}
            {o.sinif ? ` · ${o.sinif}` : ''}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        strokeWidth={2}
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ots-faint"
      />
    </div>
  );
}
