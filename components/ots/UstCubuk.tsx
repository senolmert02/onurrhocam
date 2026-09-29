'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { UYGULAMA } from '@/lib/ots/sabitler';

import { etkinMi, type MenuOgesi } from './KenarMenu';
import { ODAK_HALKASI } from './Parcalar';

/**
 * Kendi yapışkan şeridi olan sayfalar — spec §5.3 "her sayfada en fazla bir
 * yapışkan üst öğe". Burada üst çubuk statik kalır, şerit `top-0`'a oturur.
 */
export const YAPISKAN_SERITLI_SAYFALAR = [
  '/takip/program',
  '/takip/programlar',
  '/takip/rapor',
  '/takip/haftalik',
];

/** Avatar çipi için baş harfler: ilk iki kelimenin ilk harfi. */
function basHarfler(ad: string): string {
  const harfler = ad
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((kelime) => kelime[0])
    .join('');
  return (harfler || '?').toLocaleUpperCase('tr-TR');
}

/** Yoldan sayfa başlığı: en uzun eşleşen menü adresi kazanır (`/ogrenciler/12` → Öğrenciler). */
function sayfaBasligi(yol: string, ogeler: MenuOgesi[]): string {
  let enIyi: MenuOgesi | undefined;
  for (const oge of ogeler) {
    if (etkinMi(yol, oge.adres) && (!enIyi || oge.adres.length > enIyi.adres.length)) {
      enIyi = oge;
    }
  }
  return enIyi?.etiket ?? UYGULAMA.kisaAd;
}

/**
 * Üst çubuk — lg altı (spec §4.11 "Üst çubuk", §5.3, §5.6).
 *
 * Sol: sayfa başlığı; sağ: profil sayfasına giden avatar çipi (44px hedef).
 * Kaydırılınca `border-b` yerine gölge: IntersectionObserver'lı nöbetçi div,
 * scroll dinleyicisi yok (spec §6). Hamburger yok — gezinme alt çubukta.
 */
export function UstCubuk({ ogeler, kullaniciAdi }: { ogeler: MenuOgesi[]; kullaniciAdi: string }) {
  const yol = usePathname();
  const yapiskan = !YAPISKAN_SERITLI_SAYFALAR.some((p) => yol === p || yol.startsWith(`${p}/`));
  const [kaydi, setKaydi] = useState(false);
  const nobetci = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hedef = nobetci.current;
    if (!yapiskan || !hedef) return;
    const gozlemci = new IntersectionObserver(
      ([giris]) => setKaydi(!giris.isIntersecting),
      { threshold: 0 },
    );
    gozlemci.observe(hedef);
    return () => gozlemci.disconnect();
  }, [yapiskan]);

  return (
    <>
      {/* Nöbetçi: çubuğun hemen üstünde 1px; görünümden çıktığında çubuk yapışmış demektir */}
      <div ref={nobetci} aria-hidden className="h-px -mb-px lg:hidden" />
      <header
        data-kaydi={yapiskan && kaydi ? 'true' : 'false'}
        className={`yazdirma-disi z-20 flex min-h-13 items-center justify-between gap-3 border-b
          border-ots-line bg-ots-bg/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md
          transition-shadow duration-220 ease-ots data-[kaydi=true]:shadow-ots sm:px-6 lg:hidden ${
            yapiskan ? 'sticky top-0' : 'static'
          }`}
      >
        <p className="min-w-0 truncate text-[17px] font-bold leading-none text-ots-ink">
          {sayfaBasligi(yol, ogeler)}
        </p>
        <Link
          href={`${UYGULAMA.kok}/profil`}
          aria-label={`Profil — ${kullaniciAdi}`}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-[10px] ${ODAK_HALKASI}`}
        >
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full bg-ots-panel text-[12px] font-bold
              text-ots-gold-bright"
          >
            {basHarfler(kullaniciAdi)}
          </span>
        </Link>
      </header>
    </>
  );
}
